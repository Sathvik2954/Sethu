"""
SETHU AI Service — Mistral-powered subject prioritization
Uses Mistral's REST API directly (no SDK dependency).
Run with: python -m uvicorn main:app --reload --port 8000
"""

import os
import json
from datetime import date
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
MODEL = "mistral-small-latest"

app = FastAPI(title="SETHU AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ───────────────────────────────────────────

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


# ── Rule-based fallback ──────────────────────────────────────

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


# ── Mistral via REST API ─────────────────────────────────────

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


# ── Endpoints ────────────────────────────────────────────────

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