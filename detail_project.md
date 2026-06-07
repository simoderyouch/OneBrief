# Onebrief — Full Project Documentation

> A project management and client collaboration platform for freelance designers and developers. Replaces WhatsApp chaos with a structured, beautiful client experience.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [User Roles](#4-user-roles)
5. [Core Features](#5-core-features)
6. [Client Experience Design](#6-client-experience-design)
7. [Technical Architecture](#7-technical-architecture)
8. [Database Schema](#8-database-schema)
9. [API Design](#9-api-design)
10. [MVP Build Plan](#10-mvp-build-plan)
11. [Growth Roadmap](#11-growth-roadmap)
12. [Tech Stack Summary](#12-tech-stack-summary)

---

## 1. Project Overview

| Field | Detail |
|---|---|
| Project name | **Onebrief** |
| Type | Personal SaaS / internal tool |
| Target user | Solo freelance designers, developers, agencies |
| Primary goal | Replace WhatsApp-based project management with a structured client portal |
| MVP status | Complete (June 2026) |
| Tech stack | Next.js, PostgreSQL, Prisma, Supabase Storage, Resend |

### One-Line Description

> A platform where the freelancer creates a project and gives the client a private, beautiful link to view progress, leave structured feedback, approve deliverables, and track payments — all without WhatsApp.

---

## 2. Problem Statement

Freelancers managing client projects over WhatsApp face recurring pain points:

- **Feedback is scattered** — client comments are buried in chat history, mixed with voice notes and unrelated messages
- **File versions are unclear** — "the logo" could mean v1, v3, or a screenshot the client saved 2 weeks ago
- **No structured workflow** — there is no clear "approved" or "rejected" state on deliverables
- **Payment tracking is manual** — invoices sent over chat, easy to miss or dispute
- **Revision history is lost** — no record of what changed between rounds and why
- **Client expectations are vague** — "make it better" is not actionable feedback

This creates friction, delays, and a perception of low professionalism — even for highly skilled freelancers.

---

## 3. Solution

A two-sided platform:

### Freelancer side (private dashboard)
The freelancer creates and manages all their projects from one place. They upload files, set milestones, track payments, and see all client feedback in a structured format.

### Client side (private portal link)
Each project generates a private link. The client opens it, creates a lightweight portal account once, and sees a clean page with project status, deliverables, feedback tools, and payment summary. No freelancer dashboard access — just their project.

---

## 4. User Roles

### Freelancer (you)
- Creates projects
- Uploads files and versions
- Manages project status
- Views and resolves client feedback
- Logs payments and milestones
- Controls the client link (can disable or regenerate)

### Client (your client)
- Accesses project via private link
- Views deliverables and version history
- Leaves structured feedback (change request / approval / question)
- Sees payment summary (what's paid, what's due)
- Downloads approved files
- No account required

---

## 5. Core Features

### 5.1 Project Management

- Create a project with: title, description, service type (logo / packaging / website / etc.), deadline, total price
- Project statuses: `draft` → `in_progress` → `waiting_feedback` → `in_revision` → `delivered` → `archived`
- Internal notes field (not visible to client)
- Project dashboard showing all active projects with status badges and deadlines

### 5.2 File & Version Management

- Upload files via drag-and-drop (stored on Supabase Storage)
- Each file is automatically versioned: v1, v2, v3...
- Version history shows: upload date, file size, any notes added by freelancer
- Client can toggle between versions to compare
- Files can be marked: `current` / `superseded` / `final`
- Download access controlled: freelancer chooses what the client can download

### 5.3 Client Link System

- Each project generates a unique token stored in the database
- Client URL format: `yourdomain.com/p/[client-name]-[project-slug]`
- The link can be: enabled / disabled / regenerated
- Access project via private link, then sign in to the portal (one account per project)
- Optional: password-protect the link for sensitive projects

### 5.4 Feedback System

- Client leaves feedback through a structured form with:
  - Feedback type: `change_request` / `approval` / `question`
  - Description (free text)
  - Optional: reference to a specific file or version
- Freelancer sees all feedback in a list per project
- Each feedback item has a status: `open` / `in_progress` / `resolved`
- Resolved feedback is archived but not deleted (full history preserved)

### 5.5 Payment Tracking

- Set total project price at creation
- Log payment milestones: deposit / mid-project / final
- Each payment entry: amount, date, label, status (`pending` / `paid`)
- Client sees a simplified payment summary on their page:
  - Total
  - Amount paid
  - Amount remaining
  - Due date for next payment
- Currency configurable (MAD, EUR, USD, etc.)

### 5.6 Notifications

- Email to freelancer when: client leaves feedback, client approves a file
- Email to client when: freelancer uploads a new version, project status changes
- Powered by Resend API
- All emails sent from freelancer's own domain for brand consistency

### 5.7 Progress Timeline

Visual project stages shown on the client page:

```
Brief → Concepts → Refinement → Finals → Delivery
```

Freelancer manually advances the stage. Client sees current stage highlighted.

---

## 6. Client Experience Design

The client page is the product's most important surface. Every design decision prioritizes clarity and making the client feel valued.

### Key UX Principles

1. **Zero friction** — no login, no app, no account
2. **Personal feel** — freelancer's name and branding at the top
3. **Clarity over completeness** — client only sees what's relevant to them
4. **Mobile-first** — most clients will open the link on their phone

### Client Page Sections (in order)

1. **Welcome banner** — personalized greeting: "Welcome back, Karim. Updated 2 hours ago."
2. **Project header** — freelancer name + avatar, project title, service type, status badge, deadline
3. **Progress bar** — named stages with current stage highlighted
4. **Latest deliverables** — files with version pills (v1 / v2 / v3 — new)
5. **Action buttons** — primary: "Leave feedback" / secondary: "Download files"
6. **Feedback history** — past comments with type badge (change request / approval)
7. **Payment summary** — total, paid, remaining

### Feedback Form Fields

```
Feedback type:  [ Change request ]  [ Approval ]  [ Question ]
Which file:     [ dropdown of current files ]
Your comment:   [ textarea — max 500 chars ]
                [ Submit ]
```

---

## 7. Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────┐
│                  Next.js App                     │
│                                                  │
│  /dashboard        — freelancer private area     │
│  /dashboard/[id]   — single project view         │
│  /p/[token]        — client public page          │
│                                                  │
│  /api/projects     — CRUD for projects           │
│  /api/files        — upload / list / delete      │
│  /api/feedback     — create / update feedback    │
│  /api/payments     — log and list payments       │
└──────────────┬──────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
  PostgreSQL        Cloudinary
  (via Prisma)      (file storage)
       │
  Supabase (hosting)
```

### Authentication

- Freelancer authenticates with NextAuth.js (email magic link or credentials)
- Client has NO authentication — access is controlled purely by the token in the URL
- The token is a 32-character random string generated with `crypto.randomBytes(16).toString('hex')`
- Tokens are stored hashed in the database (SHA-256) for security

### File Storage Flow

```
Client uploads file
      ↓
Next.js API route receives multipart form
      ↓
File streamed to Cloudinary
      ↓
Cloudinary returns: url, public_id, format, size
      ↓
File record created in PostgreSQL:
  { url, public_id, version_number, project_id, uploaded_at }
```

---

## 8. Database Schema

### Tables

#### `users`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
email         TEXT UNIQUE NOT NULL
name          TEXT
avatar_url    TEXT
created_at    TIMESTAMP DEFAULT now()
```

#### `projects`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID REFERENCES users(id) ON DELETE CASCADE
title         TEXT NOT NULL
description   TEXT
service_type  TEXT                         -- logo, packaging, website, etc.
status        TEXT DEFAULT 'draft'         -- draft | in_progress | waiting_feedback | in_revision | delivered | archived
stage         TEXT DEFAULT 'brief'         -- brief | concepts | refinement | finals | delivery
deadline      DATE
total_price   DECIMAL(10,2)
currency      TEXT DEFAULT 'MAD'
client_name   TEXT
client_email  TEXT
token         TEXT UNIQUE NOT NULL         -- hashed public access token
token_active  BOOLEAN DEFAULT true
internal_note TEXT
created_at    TIMESTAMP DEFAULT now()
updated_at    TIMESTAMP DEFAULT now()
```

#### `files`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID REFERENCES projects(id) ON DELETE CASCADE
label           TEXT                         -- e.g. "Logo — primary mark"
cloudinary_url  TEXT NOT NULL
public_id       TEXT NOT NULL                -- Cloudinary public_id for deletion
format          TEXT                         -- png, pdf, ai, etc.
size_bytes      INTEGER
version_number  INTEGER DEFAULT 1
status          TEXT DEFAULT 'current'       -- current | superseded | final
note            TEXT                         -- freelancer note on this version
uploaded_at     TIMESTAMP DEFAULT now()
```

#### `feedback`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id   UUID REFERENCES projects(id) ON DELETE CASCADE
file_id      UUID REFERENCES files(id)       -- optional: which file this refers to
type         TEXT NOT NULL                   -- change_request | approval | question
message      TEXT NOT NULL
status       TEXT DEFAULT 'open'             -- open | in_progress | resolved
created_at   TIMESTAMP DEFAULT now()
resolved_at  TIMESTAMP
```

#### `payments`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id   UUID REFERENCES projects(id) ON DELETE CASCADE
label        TEXT                            -- e.g. "Deposit 50%"
amount       DECIMAL(10,2) NOT NULL
currency     TEXT DEFAULT 'MAD'
status       TEXT DEFAULT 'pending'          -- pending | paid
due_date     DATE
paid_date    DATE
note         TEXT
created_at   TIMESTAMP DEFAULT now()
```

#### `notifications` (optional, for log)
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id   UUID REFERENCES projects(id)
type         TEXT                            -- feedback_received | file_approved | version_uploaded
sent_to      TEXT                            -- freelancer | client
email        TEXT
sent_at      TIMESTAMP DEFAULT now()
```

### Key Relations

```
users ──< projects ──< files
                  ──< feedback ──> files (optional)
                  ──< payments
                  ──< notifications
```

---

## 9. API Design

All routes under `/api/`. Auth protected via NextAuth session middleware, except client routes which validate by token.

### Projects

| Method | Route | Description |
|---|---|---|
| GET | `/api/projects` | List all projects for logged-in freelancer |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/[id]` | Get single project with files, feedback, payments |
| PATCH | `/api/projects/[id]` | Update project (status, stage, notes, etc.) |
| DELETE | `/api/projects/[id]` | Archive project |
| POST | `/api/projects/[id]/regenerate-token` | Generate new client token |

### Files

| Method | Route | Description |
|---|---|---|
| GET | `/api/projects/[id]/files` | List all files for a project |
| POST | `/api/projects/[id]/files` | Upload new file (multipart) |
| PATCH | `/api/files/[id]` | Update file label, note, or status |
| DELETE | `/api/files/[id]` | Delete file (removes from Cloudinary too) |

### Feedback

| Method | Route | Description |
|---|---|---|
| GET | `/api/projects/[id]/feedback` | List all feedback for a project |
| POST | `/api/client/[token]/feedback` | Client submits feedback (public, token-validated) |
| PATCH | `/api/feedback/[id]` | Update feedback status (freelancer only) |

### Client (public, token-validated)

| Method | Route | Description |
|---|---|---|
| GET | `/api/client/[token]` | Get full project data for client view |
| POST | `/api/client/[token]/feedback` | Submit feedback |

### Payments

| Method | Route | Description |
|---|---|---|
| GET | `/api/projects/[id]/payments` | List payments |
| POST | `/api/projects/[id]/payments` | Add payment milestone |
| PATCH | `/api/payments/[id]` | Mark as paid, update date |

---

## 10. MVP Build Plan

### Sprint 1 — Setup (Day 1–2)

- [ ] Initialize Next.js 14 with TypeScript and App Router
- [ ] Set up Tailwind CSS
- [ ] Configure PostgreSQL via Supabase (free tier)
- [ ] Install and configure Prisma ORM
- [ ] Run first migration with all tables
- [ ] Set up Cloudinary account and env variables
- [ ] Deploy skeleton to Vercel

### Sprint 2 — Auth + Project CRUD (Day 3–6)

- [ ] Install NextAuth.js with email magic link provider
- [ ] Build login page
- [ ] Build project list dashboard (protected route)
- [ ] Build "Create project" form with all fields
- [ ] Build project detail page (freelancer view)
- [ ] Implement file upload component (drag & drop)
- [ ] Wire upload to Cloudinary and save to DB

### Sprint 3 — Client Link & Feedback (Day 7–11)

- [ ] Generate token on project creation (`crypto.randomBytes`)
- [ ] Build `/p/[token]` page (no auth required)
- [ ] Display: welcome banner, project header, progress stages, files, feedback history
- [ ] Build version toggle UI (v1 / v2 / v3 pills)
- [ ] Build feedback form (type + message + optional file reference)
- [ ] Build feedback list on freelancer dashboard
- [ ] Mark feedback as resolved

### Sprint 4 — Payment Tracking (Day 12–14)

- [ ] Build payment milestone add UI
- [ ] Display payment summary on freelancer dashboard
- [ ] Display simplified payment summary on client page
- [ ] Mark payment as paid (with date)

### Sprint 5 — Notifications + Polish (Day 15–18)

- [ ] Set up Resend API for transactional email
- [ ] Email freelancer when client submits feedback
- [ ] Email client when new file version uploaded
- [ ] Add version history labels to files
- [ ] Full mobile responsive pass on client page
- [ ] Final QA: test full flow on real project

---

## 11. Growth Roadmap

### Stage 1 — Personal tool (Now)
Use it yourself. Test it on 3–5 real client projects. Find what breaks.

**Success metric:** You stop using WhatsApp for project communication entirely.

### Stage 2 — Freelancer SaaS (3–9 months)
Open to other freelancers. Add Stripe subscription, multi-tenant architecture, custom branding per account.

**Revenue potential:** $5–15/month per user × 200 users = $1,000–3,000/month

Key additions:
- Stripe billing with free / pro tiers
- Multi-tenancy (each freelancer's data isolated)
- Custom subdomain or branding on client page
- Public landing page with waitlist

### Stage 3 — Agency platform (9–18 months)
Support teams with multiple members per workspace. Role-based access: owner / designer / viewer.

**Revenue potential:** $30–100/month per workspace

Key additions:
- Team workspaces
- Role system
- Real-time collaboration (live comments via WebSockets)
- Client approval workflow with digital sign-off
- Project templates

### Stage 4 — AI-powered platform (18–30 months)
AI becomes the core value proposition. Automates the most painful parts of freelance communication.

Key additions:
- AI converts raw client messages → structured tasks
- WhatsApp / email import: paste a conversation, AI extracts all feedback
- Scope creep detection: alerts when revision count exceeds contract
- Auto-generate project brief from a short conversation
- AI price estimator by project type and complexity
- Contract generator from project scope

### Stage 5 — Marketplace (30+ months)
Connect freelancers with clients. Network effects kick in.

Key additions:
- Public freelancer profiles and portfolios
- Client posts brief → freelancers apply
- Escrow payment system
- Reviews and ratings
- Figma / Slack / Notion integrations via API

---

## 12. Tech Stack Summary

### Core

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack in one repo, API routes built-in, great DX |
| Language | TypeScript | Type safety, better IDE support, fewer bugs |
| Styling | Tailwind CSS | Fast UI, no CSS files to manage |
| ORM | Prisma | Type-safe DB queries, easy migrations, great docs |
| Database | PostgreSQL (via Supabase) | Reliable, free tier for MVP, scales well |
| Auth | NextAuth.js | Easy to set up, supports magic link + credentials |
| File storage | Supabase Storage | Simple upload API, public CDN URLs, generous free tier |
| Email | Resend | Simple API, good free tier (3,000 emails/month) |
| Deployment | Vercel | Zero-config Next.js deploy, free tier, auto preview URLs |

### Later additions (Phase 2+)

| Layer | Technology | When |
|---|---|---|
| Payments | Stripe | Phase 2 (SaaS billing) |
| Real-time | Pusher or Ably | Phase 3 (live comments) |
| AI | OpenAI API (GPT-4o) | Phase 4 (feedback extraction) |
| Background jobs | Inngest or Trigger.dev | Phase 4 (async AI processing) |
| Search | Algolia or Postgres FTS | Phase 5 (marketplace search) |

### Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx                  ← project list
│   │   └── [id]/page.tsx             ← project detail
│   ├── p/
│   │   └── [token]/page.tsx          ← client public page
│   └── api/
│       ├── projects/route.ts
│       ├── projects/[id]/route.ts
│       ├── files/[id]/route.ts
│       ├── feedback/[id]/route.ts
│       ├── payments/[id]/route.ts
│       └── client/[token]/route.ts
├── components/
│   ├── dashboard/
│   │   ├── ProjectCard.tsx
│   │   ├── FileUpload.tsx
│   │   └── FeedbackList.tsx
│   └── client/
│       ├── ProjectHero.tsx
│       ├── ProgressStages.tsx
│       ├── FileCard.tsx
│       ├── FeedbackForm.tsx
│       └── PaymentSummary.tsx
├── lib/
│   ├── prisma.ts                     ← Prisma client singleton
│   ├── cloudinary.ts                 ← upload helpers
│   ├── email.ts                      ← Resend helpers
│   └── token.ts                      ← token generation & hashing
├── prisma/
│   └── schema.prisma
└── .env.local
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Email
RESEND_API_KEY="..."
EMAIL_FROM="studio@yourdomain.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Appendix: Key Decisions & Rationale

### Why no client login?
Requiring clients to create an account creates friction. Most clients open the link once every few days. A login wall means forgotten passwords, support requests, and clients going back to WhatsApp because "it's easier." The token-in-URL approach is how tools like Loom and Figma share content — it works because the link itself is the credential.

### Why PostgreSQL over Firebase?
Relational data (projects → files → feedback → payments) is a natural fit for SQL. Firebase is good for real-time chat or unstructured data, but managing relations with Firestore subcollections adds complexity. Prisma + Postgres gives type-safe queries, easy migrations, and a mental model that matches the domain exactly.

### Why Cloudinary over AWS S3?
S3 is more powerful but requires more setup (IAM roles, signed URLs, CORS configuration). Cloudinary provides a simpler upload API, automatic image optimization, CDN delivery, and a generous free tier. For an MVP, Cloudinary saves days of configuration.

### Why manual payment tracking first?
Stripe integration adds significant complexity: webhooks, customer objects, invoice management, and failure handling. For a personal tool, manual logging (you record when a client pays) is completely sufficient and can be built in hours instead of days. Stripe can be added in Phase 2 when there are multiple users who need automated billing.

---

*Document version 1.0 — Generated April 2026*
