# SETHU — Smart Education and Task Hub for Unified Campus Management

A full-stack campus management platform built for Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad.

**Live:** https://sethu-pied.vercel.app

---

## Tech Stack

| Layer           | Technology                                          |
| --------------- | --------------------------------------------------- |
| Frontend        | Next.js 14 (App Router, TypeScript)                 |
| Database        | Supabase (PostgreSQL + Row Level Security)          |
| Authentication  | Supabase Auth — email/password, PKCE password reset |
| Storage         | Supabase Storage                                    |
| AI Microservice | Python FastAPI on Render                            |
| OCR             | RapidOCR                                            |
| Language Model  | Mistral API                                         |
| PDF Generation  | pdf-lib                                             |
| Scheduled Jobs  | Supabase pg_cron                                    |
| 3D Landing Page | React Three Fiber + Drei                            |
| Hosting         | Vercel (frontend) · Render (AI service)             |

---

## Overview

SETHU is a role-based campus management platform built around four roles — student, faculty, head of department, and administrator. Access control lives in the database itself through Row Level Security, so every query is automatically filtered to what that user is permitted to see, regardless of how the API is called.

The core idea is continuity. A student's academic life — timetable, deadlines, subjects, requests, and documents — lives in one system instead of being scattered across WhatsApp groups, notice boards, and faculty spreadsheets. Faculty and HOD get a single place to manage their department's academic calendar and process requests. Admins sit above all of this with institution-wide visibility and direct staff account management.

---

## Who Uses What

**Students** — class timetable, exam schedule, academic almanac, faculty-defined subjects with personal annotations, combined deadline view, AI study planner, formal request submission with document download, and a resume-style profile builder.

**Faculty & HOD** — define subjects, manage class and exam timetables (with PDF import), record the academic almanac, send deadlines and notifications to specific year/section cohorts, and review requests through a department-scoped approvals queue.

**Administrators** — everything faculty can do, plus provision staff accounts directly, broadcast institution-wide notifications, and browse a full audit log of sensitive actions.

---

## Features

**Authentication** — two-step signup, real-time password strength indicator, PKCE password reset, staff accounts skip email verification, database-backed login rate limiting.

**Dashboard** — role-aware KPI cards, resume-style profile builder (8 sections), staff account management tab, searchable audit log tab, notification bell with unread count.

**Timetable, Almanac & Exams** — faculty manage three academic calendars in one view, all with PDF import (upload a document → AI extracts and structures it → review before saving). Students get read-only views: weekly grid, chronological exam list with today/overdue indicators, almanac table.

**Subjects & AI Planner** — faculty define subjects per department and year. Students annotate with difficulty, placement relevance, and important topics. The AI Planner uses those annotations plus the day's actual timetable to estimate free hours, then returns a Mistral-ranked priority list and a concrete study recommendation.

**Deadlines & Notifications** — personal and faculty-broadcast deadlines in one view with smart labelling. Automatic last-day reminders for faculty deadlines. Exam reminders at 7, 3, and 1 day out. Notifications support file attachments, priority levels, and per-notification dismiss or bulk clear.

**Requests & Approvals** — seven request types across two routing paths. HOD-routed: event permissions, complaints, gate passes, suggestions. Admin-routed: bonafide certificates, lost ID cards, fee receipts. Approval auto-generates a branded PDF for download. Payment screenshots use signed URLs. Completed requests auto-cleared after a retention period.

**Security** — Row Level Security on every table, rate limiting on login and admin actions, full audit log, time-limited signed URLs for private files, restricted CORS on the AI service.

---

## Project Structure

```
sethu/
│
├── frontend/                        # Next.js 14 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # 3D landing page
│   │   │   ├── login/
│   │   │   ├── signup/              # Two-step signup flow
│   │   │   ├── dashboard/           # Role-aware dashboard + profile builder
│   │   │   ├── timetable/           # Class, almanac, and exam tabs + PDF import
│   │   │   ├── subjects/            # Faculty-defined subjects + student notes
│   │   │   ├── planner/             # AI study planner
│   │   │   ├── deadlines/
│   │   │   ├── notifications/
│   │   │   ├── requests/            # Student request submission
│   │   │   ├── approvals/           # Staff review queue
│   │   │   ├── documents/
│   │   │   ├── legal/
│   │   │   └── api/
│   │   │       ├── check-login-attempt/   # Login rate limiting
│   │   │       ├── check-verification/    # Email verification gate
│   │   │       ├── create-staff/          # Admin: provision staff accounts
│   │   │       ├── deactivate-staff/      # Admin: remove staff accounts
│   │   │       ├── generate-document/     # Auto-generate approval PDF
│   │   │       ├── log-action/            # Write to audit log
│   │   │       ├── lookup-email/          # Resolve roll number to email
│   │   │       └── run-maintenance/       # Cleanup + reminder fallback
│   │   │
│   │   ├── components/
│   │   │   ├── Sidebar.tsx          # Role-based nav, responsive drawer
│   │   │   ├── DashboardTabs.tsx    # Overview, Profile, Accounts, Audit Log
│   │   │   ├── AccountsTab.tsx
│   │   │   ├── AuditLogTab.tsx
│   │   │   └── SkeletonLoader.tsx
│   │   │
│   │   └── lib/
│   │       ├── supabase/
│   │       │   ├── client.ts        # Browser Supabase client
│   │       │   └── server.ts        # Server-side Supabase client
│   │       └── rateLimit.ts         # DB-backed rate limiting utility
│   │
│   ├── public/
│   └── package.json
│
├── ai_service/                      # Python FastAPI microservice
│   ├── main.py                      # Endpoints, OCR, Mistral integration
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Supabase](https://supabase.com) project
- A [Mistral AI](https://console.mistral.ai) API key

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/sethu.git
cd sethu
```

---

### Step 2 — Configure environment variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

Create `ai_service/.env`:

```env
MISTRAL_API_KEY=your-mistral-api-key
```

---

### Step 3 — Set up the database

Run the following SQL files in order in the Supabase SQL Editor:

```
1.  schema-part1.sql            Drop old tables
2.  schema-part2.sql            Create all tables with RLS policies
3.  fix-role-constraint.sql     Add hod to the role check constraint
4.  fix-fk-public.sql           Point requests FK to public.users
5.  fix-rls-final.sql           Allow faculty and admin to read requests
6.  documents-bucket.sql        Create documents storage bucket
7.  almanac-schema.sql          Create almanac table + storage RLS fix
8.  exam-reminders.sql          Exam reminder scheduled job
9.  rate-limit-schema.sql       Rate limiting table + cleanup job
10. audit-log-schema.sql        Audit log table
11. add-event-end-date.sql      Optional end date for event permissions
```

---

### Step 4 — Configure Supabase Auth

In your Supabase project go to **Authentication → URL Configuration** and add the following redirect URLs:

```
http://localhost:3000/auth/callback
http://localhost:3000/reset-password
https://sethu-pied.vercel.app/auth/callback
https://sethu-pied.vercel.app/reset-password
```

---

### Step 5 — Create the first admin account

In Supabase go to **Authentication → Users → Add User** and create a user with your admin email. Then run in the SQL Editor (replace the UUID with the one Supabase generated):

```sql
-- Run once to allow admin accounts without a department
ALTER TABLE public.users ALTER COLUMN department DROP NOT NULL;

-- Insert admin profile
INSERT INTO public.users (id, full_name, email, role, department, skip_verification, email_verified_at)
VALUES (
  'paste-uuid-here',
  'Admin',
  'your@email.com',
  'admin',
  NULL,
  TRUE,
  now()
)
ON CONFLICT (id) DO UPDATE
  SET role = 'admin', skip_verification = TRUE, email_verified_at = now();
```

---

### Step 6 — Start the AI service

```bash
cd ai_service
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Verify at `http://localhost:8000` — you should see:

```json
{ "status": "ok", "service": "sethu-ai" }
```

---

### Step 7 — Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

> Both terminals must stay running. The AI service handles timetable PDF parsing and the study planner. Everything else — requests, deadlines, notifications, approvals — works without it.

---

## Deployment

| Service    | Platform | Notes                                                                                                                              |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Frontend   | Vercel   | Set root to `frontend/`. Add all `.env.local` keys as Environment Variables.                                                       |
| AI Service | Render   | Deploy `ai_service/` as a Python web service. Add `MISTRAL_API_KEY`. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT` |

After deploying the AI service, update `NEXT_PUBLIC_AI_SERVICE_URL` in Vercel to point to your Render URL and redeploy.

---

## Author

**P Sathvik Reddy**  
Chaitanya Bharathi Institute of Technology, Hyderabad

---

## License

MIT
