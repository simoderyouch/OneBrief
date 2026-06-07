# OneBrief — Implementation Tracker

> Full freelance portal — local-first (no Supabase, no Resend).  
> **Stack decision: keep Next.js + TypeScript + Prisma + PostgreSQL** — already full-stack; splitting backend adds complexity with no benefit for personal use.

Last updated: June 2026

---

## Architecture

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 16 App Router + React 19 | Dashboard + client portal |
| Backend | Next.js API routes (same repo) | No separate Express/FastAPI needed |
| Database | PostgreSQL + Prisma 7 | Projects, files metadata, payments tracking |
| File storage | **Local disk** (`storage/uploads/`) | Replace Supabase; swap to S3/R2 later via `lib/storage` |
| Notifications | **In-app + console log** | Replace Resend; plug email provider later via `lib/email.ts` |

---

## Phase A — Local infrastructure ✅

- [x] Remove `@supabase/supabase-js` — local filesystem storage (`lib/storage/local.ts`)
- [x] Remove `resend` — local notifications (`lib/email.ts`, `lib/notify.ts`)
- [x] Update `.env.example` — `STORAGE_PATH`, no cloud keys
- [x] Gitignore `storage/uploads/`

---

## Phase B — Payment gates & protection ✅

- [x] `PaymentGateMode` enum + project fields
- [x] `lib/payment-gate.ts` — gate logic
- [x] `lib/file-security.ts` — download blocked when gate unsatisfied
- [x] `PaymentGateSettings` UI on project detail
- [x] Auto-unlock final deliverables on milestone PAID (`lib/payments.ts`)
- [x] Approval status on files (`APPROVED` / `CHANGES_REQUESTED` via feedback)

---

## Phase C — Project management ✅

- [x] Extended project lifecycle statuses (LEAD, ON_HOLD, APPROVAL_PENDING, etc.)
- [x] Project fields: tags, priority, revision limit/round, brief, scope, welcome message
- [x] `DeliverablePackage` model + API + `PackageManager` UI
- [x] `ProjectTemplate` model + API
- [x] New projects default: PROTECTED tier, payment gate on, deposit rule

---

## Phase D — Statistics & CRM ✅

- [x] Home dashboard with stats widgets + activity feed
- [x] `/dashboard/clients` — client summaries + private notes
- [x] `/dashboard/stats` — revenue by month, protection report
- [x] `/dashboard/notifications` — in-app notification center
- [x] `/api/export` — CSV export
- [x] Project stats API

---

## Phase E — Still optional / future

- [x] WhatsApp notify (wa.me pre-filled message + portal link) — `NotifyWhatsApp` on project page
- [ ] PDF watermark preview (images only today)
- [ ] Side-by-side version compare UI
- [ ] Project templates UI in dashboard
- [ ] Custom portal branding UI (schema fields on User exist)
- [ ] Digest notifications (daily summary)
- [ ] Swappable storage adapter (S3/R2) — interface ready at `lib/storage`
- [ ] Swappable email adapter — interface ready at `lib/email.ts`

---

## How to run after pull

```bash
npm install
docker compose up -d          # Postgres
cp .env.example .env.local    # configure DATABASE_URL, NEXTAUTH_SECRET
npm run db:push               # apply new schema
npm run db:setup              # seed user if needed
npm run dev
```

Uploaded files land in `./storage/uploads/projects/{projectId}/`.

---

## Payment workflow (no in-app payment)

1. Create project → payment gate enabled (deposit must be PAID for finals)
2. Upload WIP → `downloadAllowed: off`, status `CURRENT`
3. Client approves via feedback type APPROVAL
4. You mark milestone **PAID** in dashboard (money received outside app)
5. Auto-unlock enables `FINAL` + download on `isFinalDeliverable` files

---

## Tests

```bash
npm test
```

Covers: `file-security`, `payment-gate`, `email` templates, file validation, tokens.
