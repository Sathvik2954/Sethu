# SETHU — Smart Education and Task Hub for Unified Campus Management

A unified campus management platform built for CBIT, combining academic planning, AI-powered study prioritization, and digital administrative workflows.

## Features

### Academic

- **Subjects** — track difficulty, syllabus coverage, exam weightage, and exam dates
- **Timetable** — weekly schedule grid with free-slot detection; import directly from a PDF (text extraction, OCR, or AI-vision parsing as fallbacks)
- **Deadlines** — assignment and lab record tracker with due-date urgency indicators
- **AI Planner** — Mistral-powered daily study prioritization based on exam proximity, syllabus coverage gaps, and difficulty, with a rule-based fallback if the AI call fails

### Administrative

- **Requests** — submit gate pass, bonafide certificate, lost ID, and fee verification requests
- **Approvals** — multi-step faculty/admin approval queue with comments
- **Documents** — auto-generated PDF certificates on final approval, downloadable from the Documents page

### Accounts

- Sign in with roll number or email
- Strong password requirements with a live strength meter
- Email verification via a 6-digit OTP, with a 7-day grace period before unverified accounts are automatically removed
- Role-aware navigation (student vs faculty/admin)

## Tech stack

- **Frontend** — Next.js 14 (App Router, TypeScript), Supabase (Auth, Postgres, Storage)
- **AI service** — FastAPI (Python), Mistral API, `pdfplumber` + EasyOCR for PDF/timetable parsing
- **Design** — Swiss-style grid layout, warm parchment palette, logo inspired by the Kakatiya Kala Thoranam (Warangal Gate)

## Project structure

```
sethu/
├── frontend/              Next.js app
│   ├── middleware.ts
│   └── src/
│       ├── app/           Pages and API routes
│       ├── components/    Logo, Sidebar, FloatingShapes, VerifyEmailBanner, etc.
│       └── lib/supabase/  Browser + server Supabase clients
└── ai-service/            FastAPI service (Mistral integration)
    ├── main.py
    └── requirements.txt
```

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- A Supabase project
- A Mistral API key

### 1. Database

Set up the following tables in Supabase, each with row-level security enabled and a policy restricting access to `auth.uid() = student_id` (or `id` for `users`):

`users`, `subjects`, `timetable`, `deadlines`, `requests`, `approval_steps`, `request_routing`, `notifications`, `ai_priority_cache`, `lecture_notes`, `exam_schedule`, `academic_calendar`

Also create a **public storage bucket** named `documents`.

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

Run:

```bash
npm run dev -H localhost
```

### 3. AI service

```bash
cd ai-service
pip install -r requirements.txt
```

Create `ai-service/.env`:

```
MISTRAL_API_KEY=your-mistral-api-key
```

Run:

```bash
python -m uvicorn main:app --reload --port 8000
```

## Supabase configuration notes

- **Authentication → Emails → SMTP Settings** — custom SMTP (e.g. Gmail SMTP with an app password) must be configured for OTP verification emails to send
- **Authentication → Emails → Templates → "Magic link or OTP"** — must include `{{ .Token }}` in the body for the 6-digit code to appear
- **Storage** — create a public bucket named `documents` with policies allowing authenticated insert/update/select

## Design system

| Token        | Value     | Use                               |
| ------------ | --------- | --------------------------------- |
| Parchment    | `#F2EDE6` | Page background                   |
| Ink          | `#1C1208` | Text, sidebar, borders            |
| Burnt orange | `#D94F00` | Primary accent, critical priority |
| Straw        | `#E8C87A` | Mid priority                      |
| Forest green | `#3D7A50` | Success, low priority             |
| Sand         | `#C8A878` | Borders, secondary accents        |
| Muted brown  | `#8A6A4A` | Secondary text                    |
| Cream        | `#FDFAF5` | Card background                   |

## Deployment

Frontend deploys to **Vercel**, AI service deploys to **Render**. Deployment steps to follow.
