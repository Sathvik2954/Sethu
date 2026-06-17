# SETHU — Smart Education and Task Hub for Unified Campus Management

A full-stack campus management platform built for Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad.

---

## Live Demo

**Application:** https://sethu-pied.vercel.app  
**AI Service:** Deployed on Render — handles timetable PDF parsing (RapidOCR + Mistral) and AI study planning (Mistral)

---

## Tech Stack

| Layer           | Technology                                              |
| --------------- | ------------------------------------------------------- |
| Frontend        | Next.js 14 (App Router, TypeScript)                     |
| Database        | Supabase (PostgreSQL with Row Level Security)           |
| Authentication  | Supabase Auth — email/password, PKCE password reset     |
| Storage         | Supabase Storage                                        |
| AI Microservice | Python FastAPI deployed on Render                       |
| OCR             | RapidOCR (onnxruntime) for timetable PDF extraction     |
| Language Model  | Mistral API — timetable parsing and study planning      |
| PDF Generation  | pdf-lib — auto-generates approval documents server-side |
| 3D Landing Page | React Three Fiber + Drei                                |
| Hosting         | Vercel (frontend), Render (AI service) — both free tier |

---

## Overview

SETHU is a role-based campus platform with four user roles — student, faculty, HOD, and admin — each with a distinct set of capabilities and access controls enforced at the database level through Row Level Security.

**Students** can view their department timetable, annotate faculty-defined subjects with personal notes (difficulty, placement relevance, important topics), manage personal deadlines alongside faculty-broadcast deadlines, submit HOD and administrative requests, download auto-generated approval documents, run an AI-powered study planner, maintain a full resume-style profile, and receive department-targeted notifications.

**Faculty and HOD** can define subjects for their department, set and manage class and exam timetables (with a PDF import option powered by RapidOCR and Mistral), send deadlines and notifications to their department (optionally filtered by year and section), and review and action student requests submitted to their department.

**Admin** has all of the above plus institution-wide notification and deadline broadcasting, a full account management panel to create and manage faculty, HOD, and admin accounts without email verification, and access to all requests across all departments.

---

## Features

### Authentication and Accounts

- Email and password signup with a two-step form (account details, then student academic details)
- Password strength meter with real-time validation
- PKCE-based password reset flow via email
- Staff accounts (faculty, HOD, admin) are created directly by admin with a temporary password — no email verification required
- Role-based redirect and access control enforced at both the layout and database level

### Dashboard

- Role-aware KPI cards — students see active deadlines, open requests, and subject count; staff see pending approvals and department stats
- Contextual setup checklist for new students
- MY PROFILE tab with a full resume-style profile builder: personal information, professional summary, education, experience, technical skills, projects, certifications, and leadership and achievements — stored as JSONB in a separate profiles table
- ACCOUNTS tab visible to admin only — create faculty, HOD, and admin accounts; view all staff with role filters; delete accounts
- Notification bell in the tab bar with an unread count badge and a slide-in drawer showing the latest 20 notifications with read receipts

### Timetable

- Faculty and HOD can add class slots manually (day, time slot, subject, faculty, room) per department, year, and section
- PDF import panel for faculty: upload a timetable PDF, parse it via the Render AI service (RapidOCR extracts coordinates and text, Mistral structures the data), review and edit parsed slots in a table before saving
- Separate exam timetable tab: faculty add exam entries (subject, date, start and end time, venue)
- Students see a read-only weekly grid for class timetable and a chronological card list for exams, with today and overdue highlights

### Subjects and AI Planner

- Faculty define subjects per department and year (subject code, name, credits, type: theory, lab, or elective)
- Students annotate each subject with difficulty level, placement importance flag, higher studies flag, important topics, placement-specific topics, and personal notes — stored per student per subject
- AI Planner reads all faculty-defined subjects, enriches them with the student's annotations, estimates free hours from today's timetable, and calls the Mistral endpoint on the AI service
- Returns a ranked priority list with a level (critical, high, mid, low), score, and reason per subject, plus a study recommendation paragraph
- Falls back to rule-based scoring if the Mistral API is unavailable

### Deadlines

- Students create personal deadlines with title, due datetime, priority (low, medium, high), and description
- Faculty and HOD broadcast deadlines to their department with optional section and year filters
- Combined view shows personal and faculty-sent deadlines together with smart due-date labels (overdue, due today, due in N days)
- Personal deadlines can be marked done or deleted; faculty deadlines are read-only for students

### Notifications

- Faculty and HOD send notifications to their department with optional section and year targeting
- Admin sends institution-wide or to a specific department
- Optional file attachment stored in Supabase Storage
- Priority: normal or urgent (urgent displays a distinct red border and badge)
- Read receipts tracked per user; unread count reflected in the dashboard bell icon

### Requests and Approvals

HOD-routed requests: Event and Placement Permission, Complaint, Gate Pass, Suggestion  
Admin-routed requests: Bonafide Certificate, Lost ID Card, Fee Receipt

- Requests are department-routed — a CSE student's request goes to the CSE faculty or HOD
- Administrative requests (bonafide, lost ID, fees) require a payment screenshot upload
- Faculty and admin review requests in an approvals queue with status filters and section filters
- On approval, the system auto-generates a branded A4 PDF (SETHU letterhead, student details, request details, admin message, declaration) using pdf-lib, uploads it to Supabase Storage, and saves the URL to the request record
- Students see a download button on their request card and in the Documents page
- ID card replacement approvals include a collection date/time and location notice for the student

### Profile

Full resume-style profile with eight sections, each collapsible and independently editable:
Personal Information, Professional Summary, Education, Experience, Technical Skills, Projects, Certifications, and Leadership and Achievements. Profile photo upload to Supabase Storage. Personal information saves to the users table; resume sections upsert to a separate profiles table.

### Jobs

Sidebar link to a companion job recommender application (https://job-recommender-sigma.vercel.app) which opens in a new tab.

---

## Database

Nine tables in the public schema, all with Row Level Security enabled:

`users` — all platform users extending Supabase auth, with role, department, year, section, and profile fields  
`profiles` — resume-style profile data using JSONB arrays for education, experience, projects, certifications, and achievements  
`notifications` — department-targeted notifications with sender, targeting fields, priority, and optional attachment  
`notification_reads` — read receipts mapping users to notifications  
`timetable_slots` — class and exam slots per department, year, and section  
`subjects` — faculty-defined subjects per department and year  
`student_subject_notes` — per-student annotations on subjects  
`deadlines` — personal student deadlines and faculty-broadcast deadlines with source and targeting fields  
`requests` — all seven request types with type-specific columns, status, admin notes, and generated PDF URL

Four storage buckets: `avatars` (public, profile photos), `documents` (public, generated PDFs), `notifications` (public, notification attachments), `request-attachments` (private, payment screenshots).

---

## AI Service

The FastAPI service exposes two endpoints and is deployed separately on Render.

`POST /parse-timetable` — accepts a PDF file, uses pdfplumber and RapidOCR for coordinate-based text extraction, then calls Mistral to parse the extracted text into structured slot objects (day, start time, end time, subject code, subject name, slot type, room).

`POST /prioritize` — accepts a list of subjects with metadata (difficulty, exam weightage, credits, exam date) and the student's free hours for today, calls Mistral to produce a ranked priority list with scores, levels, and reasons, and returns a study recommendation paragraph.

---

## Setup

### Prerequisites

- Node.js 18 or later
- Python 3.10 or later
- Supabase project
- Mistral API key

### Environment Variables

Frontend (`frontend/.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_AI_SERVICE_URL=
```

AI Service (`ai_service/.env`):

```
MISTRAL_API_KEY=
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### AI Service

```bash
cd ai_service
pip install -r requirements.txt
uvicorn main:app --reload
```

### Database

Run the following SQL files in order in the Supabase SQL Editor:

1. `schema-part1.sql` — drops old tables cleanly
2. `schema-part2.sql` — creates all tables with RLS policies
3. `fix-role-constraint.sql` — adds hod to the role check constraint
4. `fix-fk-public.sql` — points the requests foreign key to public.users
5. `fix-rls-final.sql` — allows faculty and admin to read requests
6. `documents-bucket.sql` — creates the documents storage bucket

### Supabase Auth Configuration

In Supabase → Authentication → URL Configuration, set the following redirect URLs:

```
https://sethu-pied.vercel.app/auth/callback
https://sethu-pied.vercel.app/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/reset-password
```

---

## Security

All database tables use Row Level Security. Students access only their own records. Faculty and HOD access records scoped to their department. Admin has unrestricted access. Staff account creation uses the Supabase service role key exclusively server-side and is never exposed to the client. File uploads are scoped to user ID folders in storage. Password reset uses the PKCE flow with a server-side code exchange.

---

## Author

**P Sathvik Reddy**  
Chaitanya Bharathi Institute of Technology, Hyderabad

---

## License

MIT
