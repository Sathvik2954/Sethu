# SETHU — Smart Education and Task Hub for Unified Campus Management

A full-stack campus management platform built for Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad.

---

## Live Demo

**Application:** https://sethu-pied.vercel.app  
**AI Service:** Deployed on Render — handles document parsing and AI-assisted study planning

---

## Tech Stack

| Layer           | Technology                                              |
| --------------- | ------------------------------------------------------- |
| Frontend        | Next.js 14 (App Router, TypeScript)                     |
| Database        | Supabase (PostgreSQL with Row Level Security)           |
| Authentication  | Supabase Auth — email/password, PKCE password reset     |
| Storage         | Supabase Storage                                        |
| AI Microservice | Python FastAPI deployed on Render                       |
| OCR             | RapidOCR for scanned document extraction                |
| Language Model  | Mistral API — document parsing and study planning       |
| PDF Generation  | pdf-lib — auto-generates approval documents server-side |
| Scheduled Jobs  | Supabase pg_cron for recurring background tasks         |
| 3D Landing Page | React Three Fiber + Drei                                |
| Hosting         | Vercel (frontend), Render (AI service)                  |

---

## Overview

SETHU is a role-based campus management platform designed around four distinct user roles — student, faculty, head of department, and administrator — each with a carefully scoped set of capabilities. Rather than relying on the frontend to enforce who can see or do what, access control is built into the database itself through Row Level Security, so every query is automatically filtered to what that user is actually permitted to access.

The platform's core idea is continuity: a student's academic life — timetable, deadlines, subjects, requests, and documents — should live in one connected system instead of being scattered across WhatsApp groups, notice boards, and individual faculty spreadsheets. Faculty and HOD accounts mirror this by giving department staff a single place to manage their section's academic calendar, communicate with students, and process requests, without needing separate tools for each task. Administrators sit above all of this with institution-wide visibility and the ability to provision and manage staff accounts directly.

A guiding principle throughout the platform is that information should reach the right audience automatically. Requests submitted by a student route to their own department's faculty or HOD without any manual forwarding. Notifications and deadlines broadcast by faculty are automatically scoped to the department, year, and section they're intended for. Exam reminders and last-day deadline alerts are generated and delivered on a schedule, without requiring anyone to remember to send them.

---

## Who Uses What

**Students** get a single dashboard for everything academic: a live view of their department's class timetable and exam schedule, the official academic almanac, faculty-defined subjects they can annotate with their own notes on difficulty and exam relevance, a combined view of personal and faculty-issued deadlines, and an AI-assisted study planner that recommends what to focus on based on the subjects they choose to analyse and the free time they actually have that day. Students can also submit a range of formal requests — from event permissions to bonafide certificates — and track their status until an officially generated document is ready to download. A full resume-style profile section lets students maintain their education, experience, and project history in one place, and a companion job recommender is one click away from the sidebar.

**Faculty and HOD accounts** are built around managing a department's day-to-day academic operations. They define the subjects offered each year, set and maintain class and exam timetables (with the option to import an existing timetable PDF and have it parsed automatically rather than re-entering it by hand), record the academic almanac, and communicate with students through targeted deadlines and notifications. When students submit requests, faculty and HOD review and act on them through a dedicated approvals queue — and because routing is department-aware, faculty only ever see requests relevant to their own department, never the institution at large.

**Administrators** have the broadest view of the system. In addition to everything faculty and HOD can do for their own scope, admins can provision new faculty, HOD, and admin accounts directly — without requiring those accounts to go through email verification — and can broadcast notifications at the institution level rather than being limited to a single department. A dedicated audit log gives admins visibility into every sensitive action taken across the platform, from account creation to request decisions, so there's always a record of who did what and when.

---

## Feature Highlights

### Authentication & Account Management

A two-step signup flow collects account credentials first and academic details second, with a real-time password strength indicator guiding users toward a secure password. Password resets use the PKCE flow for proper security on the redirect. Staff accounts skip the usual email verification step since they're provisioned directly by an administrator, and login attempts are rate-limited at the database level to guard against brute-force attempts.

### Dashboard

The dashboard adapts its content based on role — students see KPIs around deadlines, requests, and subjects, while staff see department-level stats and pending approvals. A resume-style profile builder lives in its own tab, letting users maintain personal information, a professional summary, education, work experience, technical skills, projects, certifications, and achievements. Admins get two additional tabs: one for managing staff accounts, and one for browsing the searchable audit log. A notification bell with an unread-count badge gives quick access to recent updates without leaving the page.

### Timetable, Almanac & Exams

Faculty and HOD manage three interconnected academic calendars in one place: the weekly class timetable, the exam schedule, and the official academic almanac (course registration windows, class work periods, test dates, and holidays). All three support a PDF import workflow — upload an existing document and the AI service extracts and structures the data automatically, with a review step before anything is saved. Students see clean, read-only views: a weekly grid for classes, a chronological list for exams with live "today" and "overdue" indicators, and a table view of the almanac.

### Subjects & AI-Assisted Planning

Faculty define the subjects offered for their department and year. Students layer their own context on top — marking difficulty, flagging subjects as placement- or higher-study-relevant, and noting important topics — which then feeds directly into an AI study planner. Students choose which subjects to include in a given planning session, the system estimates their free hours for the day from their actual timetable, and the planner returns a ranked, reasoned priority list along with a concrete study recommendation.

### Deadlines & Notifications

Students track their own personal deadlines alongside anything broadcast by their faculty, with smart due-date labelling so it's immediately clear what's overdue or due today. The system automatically reminds students on the final day of a faculty-issued deadline, and similarly sends exam-approaching reminders a week, three days, and one day out. Notifications support file attachments and priority levels, and can be dismissed individually or cleared in bulk — separate from simply being marked as read.

### Requests & Approvals

SETHU handles seven distinct request types split across two routing paths: HOD-routed requests (event permissions, complaints, gate passes, suggestions) go exclusively to faculty and HOD, while administrative requests (bonafide certificates, lost ID cards, fee receipts) route to admin. On approval, the platform automatically generates a branded, properly formatted PDF document and makes it available for download — no manual document creation required on either side. Sensitive uploads like payment screenshots are handled through short-lived signed URLs rather than public links, and completed requests are automatically cleared from view after a set retention period.

### Security

Every table in the system enforces Row Level Security, meaning access control isn't just a frontend convenience — it's structurally impossible to query data outside your permitted scope, even if the API were called directly. Sensitive administrative actions are rate-limited and logged to an audit trail visible only to admins, file access for private content uses time-limited signed URLs, and the AI service restricts which origins are allowed to call it.

---

## Setup

### Prerequisites

Node.js 18+, Python 3.10+, a Supabase project, and a Mistral API key.

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

### Running locally

```bash
cd frontend && npm install && npm run dev
cd ai_service && pip install -r requirements.txt && uvicorn main:app --reload
```

### Database

Schema and migration files are provided separately and should be applied in order through the Supabase SQL Editor.

### Supabase Auth Configuration

In Supabase → Authentication → URL Configuration, register your deployment and localhost URLs for the `/auth/callback` and `/reset-password` routes.

---

## Author

**P Sathvik Reddy**  
Chaitanya Bharathi Institute of Technology, Hyderabad

---

## License

MIT
