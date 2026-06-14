"""
SETHU AI Service — Mistral-powered subject prioritization + timetable parsing
Uses Mistral's REST API directly (no SDK dependency).
Run with: python -m uvicorn main:app --reload --port 8000
"""

import os
import io
import json
import base64
from datetime import date
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
import pdfplumber
import numpy as np
from PIL import Image

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
MODEL = "mistral-small-latest"

# Vision model — last-resort fallback if OCR produces nothing usable.
# NOTE: this model name is the part I'm least certain about.
VISION_MODEL = "pixtral-12b-2409"

app = FastAPI(title="SETHU AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ──────────────────────────────────────────────

class SubjectIn(BaseModel):
    name: str
    code: str
    difficulty: int
    coverage_pct: int
    exam_weightage: int
    exam_date: str | None
    credits: int = 3


class PrioritizeRequest(BaseModel):
    subjects: list[SubjectIn]
    free_hours_today: float = 2.0


# ── Rule-based fallback ──────────────────────────────────────────

def rule_based_priority(subjects: list[SubjectIn]) -> dict:
    today = date.today()
    scored = []

    for s in subjects:
        days_left = None
        urgency = 0.0
        if s.exam_date:
            try:
                d = date.fromisoformat(s.exam_date)
                days_left = (d - today).days
                if days_left <= 0:
                    urgency = 0.0
                elif days_left <= 3:
                    urgency = 1.0
                elif days_left <= 7:
                    urgency = 0.8
                elif days_left <= 14:
                    urgency = 0.6
                elif days_left <= 30:
                    urgency = 0.4
                else:
                    urgency = 0.2
            except ValueError:
                pass

        coverage_gap = (100 - s.coverage_pct) / 100
        difficulty_norm = s.difficulty / 5
        weightage_norm = s.exam_weightage / 100

        score = round(
            (urgency * 0.40 +
             coverage_gap * 0.30 +
             difficulty_norm * 0.20 +
             weightage_norm * 0.10) * 100
        )

        if score >= 75:
            level = "critical"
        elif score >= 50:
            level = "high"
        elif score >= 30:
            level = "mid"
        else:
            level = "low"

        scored.append({
            "code": s.code,
            "name": s.name,
            "score": score,
            "level": level,
            "days_to_exam": days_left,
            "reason": f"{100 - s.coverage_pct}% syllabus remaining"
                      + (f", exam in {days_left} days" if days_left and days_left > 0 else ""),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[0] if scored else None

    return {
        "source": "rules",
        "priorities": scored,
        "recommendation": (
            f"Focus on {top['name']} today — {top['reason']}."
            if top else "Add subjects with exam dates to get recommendations."
        ),
    }


# ── Mistral via REST API ─────────────────────────────────────────

def mistral_priority(subjects: list[SubjectIn], free_hours: float) -> dict:
    today = date.today().isoformat()

    subject_lines = []
    for s in subjects:
        subject_lines.append(
            f"- {s.code} ({s.name}): difficulty {s.difficulty}/5, "
            f"coverage {s.coverage_pct}%, exam weightage {s.exam_weightage}, "
            f"exam date {s.exam_date or 'not set'}, credits {s.credits}"
        )

    prompt = f"""You are an academic planning assistant for an engineering student.
Today's date is {today}. The student has {free_hours} free hours today.

Their subjects:
{chr(10).join(subject_lines)}

Rank ALL subjects by study priority for today. Consider: days remaining to exam
(closest exams matter most), syllabus coverage gaps, difficulty, and exam weightage.

Respond with ONLY a JSON object, no markdown fences, no extra text, in exactly
this shape:
{{
  "priorities": [
    {{
      "code": "SUBJECT_CODE",
      "name": "Subject Name",
      "score": 0-100 integer,
      "level": "critical" | "high" | "mid" | "low",
      "days_to_exam": integer or null,
      "reason": "one short sentence why this rank"
    }}
  ],
  "recommendation": "One specific, actionable sentence: what to study today and for how long, using the free hours available."
}}"""

    response = httpx.post(
        MISTRAL_URL,
        headers={
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
        },
        timeout=30.0,
    )
    response.raise_for_status()

    text = response.json()["choices"][0]["message"]["content"].strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    parsed = json.loads(text)
    parsed["source"] = "mistral"
    return parsed


# ── PDF text extraction (text-based PDFs) ────────────────────────

def extract_pdf_text(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
    return "\n".join(text_parts)


# ── PDF page rendering (for OCR / vision) ────────────────────────

def render_pdf_pages_as_png(file_bytes: bytes, max_pages: int = 3, resolution: int = 250) -> list[bytes]:
    images = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages[:max_pages]:
            page_image = page.to_image(resolution=resolution)
            buf = io.BytesIO()
            page_image.original.save(buf, format="PNG")
            images.append(buf.getvalue())
    return images


# ── EasyOCR — lazy-loaded reader (model weights download on first use) ──

_ocr_reader = None
_ocr_available = True

def get_ocr_reader():
    global _ocr_reader, _ocr_available
    if not _ocr_available:
        return None
    if _ocr_reader is None:
        try:
            import easyocr
            _ocr_reader = easyocr.Reader(['en'], gpu=False)
        except ImportError:
            # EasyOCR not installed (e.g. lightweight deployment) —
            # OCR mode is skipped and we fall through to vision mode.
            _ocr_available = False
            return None
    return _ocr_reader


def ocr_image_to_text(img_bytes: bytes) -> str:
    """Run EasyOCR on an image and reconstruct rough row/column structure
    based on text bounding box positions, so a table-like layout survives
    as text (columns joined with ' | '). Returns "" if EasyOCR isn't
    available."""
    reader = get_ocr_reader()
    if reader is None:
        return ""

    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    img_array = np.array(img)

    results = reader.readtext(img_array, detail=1)
    if not results:
        return ""

    # bbox is 4 points [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
    items = []
    heights = []
    for bbox, text, conf in results:
        ys = [p[1] for p in bbox]
        xs = [p[0] for p in bbox]
        y_center = sum(ys) / len(ys)
        x_center = sum(xs) / len(xs)
        heights.append(max(ys) - min(ys))
        items.append((y_center, x_center, text))

    heights.sort()
    median_height = heights[len(heights) // 2] if heights else 15
    row_threshold = max(median_height * 0.7, 5)

    items.sort(key=lambda i: i[0])

    rows = []
    current_row = []
    current_y = None

    for y, x, text in items:
        if current_y is None or abs(y - current_y) <= row_threshold:
            current_row.append((x, text))
            current_y = y if current_y is None else (current_y + y) / 2
        else:
            rows.append(current_row)
            current_row = [(x, text)]
            current_y = y
    if current_row:
        rows.append(current_row)

    lines = []
    for row in rows:
        row.sort(key=lambda i: i[0])
        lines.append(" | ".join(t for _, t in row))

    return "\n".join(lines)


# ── Robust JSON extraction from model responses ─────────────────

def strip_json_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return text


def extract_slot_list(raw_content: str) -> list[dict]:
    """Try hard to get a list of slot dicts out of a model response,
    even if the model added extra text or wrapped the array in an object.
    Raises HTTPException with the raw content (truncated) if it can't."""
    text = strip_json_fences(raw_content)

    candidates = [text]

    # If there's a JSON array anywhere in the text, try that slice too
    start, end = text.find('['), text.rfind(']')
    if start != -1 and end != -1 and end > start:
        candidates.append(text[start:end + 1])

    # If there's a JSON object anywhere in the text, try that slice too
    start, end = text.find('{'), text.rfind('}')
    if start != -1 and end != -1 and end > start:
        candidates.append(text[start:end + 1])

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue

        if isinstance(parsed, list):
            return parsed

        if isinstance(parsed, dict):
            for key in ("slots", "timetable", "schedule", "data", "result", "items"):
                if key in parsed and isinstance(parsed[key], list):
                    return parsed[key]
            list_values = [v for v in parsed.values() if isinstance(v, list)]
            if len(list_values) == 1:
                return list_values[0]

    raise HTTPException(
        status_code=502,
        detail=f"AI response could not be parsed into a slot list. Raw response: {raw_content[:800]}"
    )


TIMETABLE_EXTRACTION_RULES = """For each slot, determine:
- day_of_week: integer 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday
- start_time: "HH:MM" in 24-hour format
- end_time: "HH:MM" in 24-hour format
- subject_code: short code as it appears (e.g. "CS301"), or null if it's a break/free slot
- subject_name: full subject name if identifiable, else null
- slot_type: one of "class", "lab", "free", "break"
- room: room number if shown, else null

Return ONLY a valid JSON array of objects with exactly these keys. No explanation, no markdown formatting, no code fences — just the raw JSON array."""

CLASS_TIMETABLE_TEXT_PROMPT = f"""You are given raw text extracted from a college class timetable PDF (a weekly schedule grid).

Extract every class/lab/free/break slot you can identify.

{TIMETABLE_EXTRACTION_RULES}

TIMETABLE TEXT:
"""

CLASS_TIMETABLE_OCR_PROMPT = f"""You are given OCR output from a college class timetable image (a weekly schedule grid).

This text was produced by OCR — items on the same row of the table are joined with " | ",
but spacing, ordering, and a few characters may be imperfect. Use context (day names,
time patterns like "9:00-10:00", subject-code patterns like "CS301") to reconstruct the
table correctly despite OCR noise.

Extract every class/lab/free/break slot you can identify.

{TIMETABLE_EXTRACTION_RULES}

OCR TEXT:
"""

CLASS_TIMETABLE_IMAGE_PROMPT = f"""This image shows a college class timetable (a weekly schedule grid).

Extract every class/lab/free/break slot you can identify from the image.

{TIMETABLE_EXTRACTION_RULES}"""


# ── Mistral parsing calls ────────────────────────────────────────

def mistral_parse_with_prompt(prompt_prefix: str, text: str) -> list[dict]:
    prompt = prompt_prefix + text[:12000]

    response = httpx.post(
        MISTRAL_URL,
        headers={
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
        },
        timeout=60.0,
    )
    response.raise_for_status()

    raw_content = response.json()["choices"][0]["message"]["content"]
    return extract_slot_list(raw_content)


def mistral_parse_images(images: list[bytes]) -> list[dict]:
    all_slots = []

    for img_bytes in images:
        b64 = base64.b64encode(img_bytes).decode("utf-8")

        response = httpx.post(
            MISTRAL_URL,
            headers={
                "Authorization": f"Bearer {MISTRAL_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": VISION_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": CLASS_TIMETABLE_IMAGE_PROMPT},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                        ],
                    }
                ],
                "temperature": 0.1,
            },
            timeout=90.0,
        )
        response.raise_for_status()

        raw_content = response.json()["choices"][0]["message"]["content"]
        all_slots.extend(extract_slot_list(raw_content))

    return all_slots


# ── Endpoints ─────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "service": "sethu-ai"}


@app.post("/prioritize")
def prioritize(req: PrioritizeRequest):
    if not req.subjects:
        return {
            "source": "none",
            "priorities": [],
            "recommendation": "No subjects provided. Add subjects first.",
        }

    if not MISTRAL_API_KEY:
        return rule_based_priority(req.subjects)

    try:
        return mistral_priority(req.subjects, req.free_hours_today)
    except Exception as e:
        result = rule_based_priority(req.subjects)
        result["fallback_reason"] = str(e)[:200]
        return result


@app.post("/parse-timetable")
async def parse_timetable(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    if not MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY is not configured")

    file_bytes = await file.read()

    # ── 1. Try direct text extraction ──
    try:
        raw_text = extract_pdf_text(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

    if raw_text.strip():
        try:
            slots = mistral_parse_with_prompt(CLASS_TIMETABLE_TEXT_PROMPT, raw_text)
            return {"slots": slots, "mode": "text"}
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Mistral API error (text mode): {e}")

    # ── 2. No embedded text — render pages and run EasyOCR ──
    try:
        images = render_pdf_pages_as_png(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not render PDF pages as images: {e}")

    if not images:
        raise HTTPException(status_code=400, detail="PDF appears to have no pages")

    ocr_text_parts = []
    try:
        for img_bytes in images:
            page_text = ocr_image_to_text(img_bytes)
            if page_text:
                ocr_text_parts.append(page_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {e}")

    ocr_text = "\n\n--- PAGE BREAK ---\n\n".join(ocr_text_parts)

    if ocr_text.strip():
        try:
            slots = mistral_parse_with_prompt(CLASS_TIMETABLE_OCR_PROMPT, ocr_text)
            return {"slots": slots, "mode": "ocr"}
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Mistral API error (ocr mode): {e}")

    # ── 3. OCR produced nothing — last resort: vision model ──
    try:
        slots = mistral_parse_images(images)
        return {"slots": slots, "mode": "vision"}
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Text extraction, OCR, and vision parsing all failed. "
                f"Vision error: {e}. The model name '{VISION_MODEL}' may "
                "need updating — check current Mistral docs."
            ),
        )