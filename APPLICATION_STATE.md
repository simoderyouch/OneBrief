# Project state (canonical snapshot)

**Product:** **Onebrief** (`lib/brand.ts`) — structured client collaboration for freelancers (private project links, deliverables, feedback, payments, scope change requests).  
**Package:** `freelancer-platform@0.1.0`  
**Snapshot:** April 2026

This file describes **what exists in the codebase today**: stack, main flows, APIs, data model, and known gaps. For deeper design notes, see `SYSTEM_DESIGN.md`. For setup commands, see `README.md`.

---

## 1. Tech stack

| Layer | Choice |
|--------|--------|
| App | **Next.js 16** (App Router), **React 19**, TypeScript |
| Data | **Prisma 7** + **PostgreSQL** (`@prisma/adapter-pg` + `pg`) |
| Freelancer auth | **NextAuth.js v4** (Credentials + JWT), `@auth/prisma-adapters` |
| Client portal auth | **Per-project accounts** (`ProjectClient`), **bcrypt** passwords, **HMAC-signed HttpOnly cookie** (`ob_pc`) — see §4 |
| Files | **Supabase Storage** (bucket `project-files`; DB columns retain legacy names `cloudinary_url` / `public_id` in places) |
| Email | **Resend** (`lib/email.ts`, `lib/notify.ts`), optional at build time |
| UI | **Tailwind CSS 4**, `tailwind-merge`, `class-variance-authority`, `lucide-react` |
| Tests | **Vitest** — `tests/lib/*` (token, email templates, file validation, feedback labels) |
| Rate limits | **Upstash Redis** REST when configured; otherwise in-memory per process |

---

## 2. User-facing surfaces

| Route | Who | Purpose |
|--------|-----|---------|
| `/` | Public | Landing |
| `/login`, `/register` | Freelancer | Credentials auth |
| `/dashboard` | Freelancer | Project list |
| `/dashboard/[id]` | Freelancer | Project detail: files, feedback, payments, work requests, token actions, internal notes |
| `/dashboard/settings` | Freelancer | Profile, **nickname** (studio name), notification toggles |
| `/p/[token]` | Client | **Portal:** must **register or sign in** (per project) before seeing deliverables, feedback, work requests, payment summary |

**Client link:** URL accepts raw (32 hex) or stored (64 hex) token forms (`lib/token.ts`).

---

## 3. Core product flows (implemented)

### Freelancer

- CRUD projects; **regenerate** client token; optional token expiry / revoke fields on `Project`.
- Upload files (validated size/type), versioning (`parentId`, `versionNumber`, soft delete).
- **Feedback** from client appears on dashboard; freelancer can resolve (`PATCH /api/feedback/[id]`).
- **Payments:** milestones and lines; statuses include overdue handling (`lib/payments`); optional Stripe link per line; dashboard + client views.
- **Work requests:** client asks for extra scope → thread while `PENDING` → freelancer sends **quote** (`QUOTED`) → client accepts/declines → on accept, **`CHANGE_ORDER` payment line** + link to optional Stripe.
- **Change orders:** manual `CHANGE_ORDER` lines from the dashboard are restricted; extra scope is expected to flow from **accepted work requests** (see API logic under `app/api/projects/[id]/payments`).

### Client (`/p/[token]`)

- **Registration / login** for that **project only** (`ProjectClient`: unique `(projectId, email)`).
- Session cookie **`ob_pc`**: signed payload `{ projectId, projectClientId, exp }` — `lib/client-portal-session.ts` (secret: `CLIENT_PORTAL_SECRET` or `NEXTAUTH_SECRET`).
- **Feedback** and **work requests** require portal session; identity comes from `ProjectClient`, not ad-hoc “your name” fields.
- **Public page refresh:** client UI can poll `router.refresh()` (~45s) so freelancer-side updates appear without realtime (`PublicPageRefresh`).
- Legacy rows: feedback/work requests **without** `projectClientId` may still **display**; client actions on very old work requests without linkage may return **403** with an explanatory message.

---

## 4. HTTP API (App Router `route.ts`)

**Freelancer (authenticated)**

| Method & path | Role |
|---------------|------|
| `POST /api/auth/register` | Create freelancer |
| `/api/auth/[...nextauth]` | NextAuth |
| `GET/POST /api/projects` | List / create projects |
| `GET/PATCH/DELETE /api/projects/[id]` | Project CRUD |
| `POST /api/projects/[id]/regenerate-token` | New client link |
| `GET/POST /api/projects/[id]/files` | List / upload |
| `GET/PATCH/DELETE /api/files/[id]` | File metadata / soft-delete |
| `GET /api/projects/[id]/feedback` | Feedback list |
| `GET/POST /api/projects/[id]/payments` | Payments |
| `PATCH /api/payments/[id]` | Update payment |
| `PATCH /api/projects/[id]/work-requests/[requestId]` | Quote / status (freelancer) |
| `POST /api/projects/[id]/work-requests/[requestId]/messages` | Freelancer reply in thread |
| `PATCH /api/feedback/[id]` | e.g. resolve feedback |
| `GET/PATCH /api/user/profile`, `GET/PATCH /api/user/settings` | Profile & prefs |

**Client (public token + portal session where noted)**

| Method & path | Role |
|---------------|------|
| `GET /api/client/[token]` | Public project JSON (no portal required for discovery) |
| `POST /api/client/[token]/register` | Create `ProjectClient`, set cookie |
| `POST /api/client/[token]/login` | Login, set cookie |
| `POST /api/client/[token]/logout` | Clear cookie |
| `POST /api/client/[token]/feedback` | Submit feedback (**session required**) |
| `POST /api/client/[token]/work-requests` | New work request (**session required**) |
| `POST .../work-requests/[id]/messages` | Client reply (**session** + ownership) |
| `POST .../work-requests/[id]/accept` | Accept quote (**session** + ownership) |
| `POST .../work-requests/[id]/decline` | Decline quote (**session** + ownership) |

---

## 5. Data model (Prisma) — high level

| Model | Notes |
|--------|--------|
| **User** | Freelancer; `nickname` + `name`; notification booleans; password for credentials |
| **Project** | Owned by user; status/stage; pricing; **client-facing token** + optional expiry/revoke; `clientName` / `clientEmail` (freelancer CRM-style fields, separate from portal) |
| **ProjectClient** | Portal user per project: `email`, `fullName`, `passwordHash`; ties feedback & work requests |
| **File** | Versioning, Supabase URLs in legacy-named columns, `deletedAt` |
| **Feedback** | Types, status, optional file; `projectClientId` + legacy `submittedByName` / `submittedBySessionId` |
| **Payment** | `lineKind`: `MILESTONE` \| `CHANGE_ORDER`; Stripe link; status lifecycle |
| **WorkRequest** | Pipeline + `WorkRequestMessage` thread |
| **Notification** | Outbound email log |
| **AccessLog** | Public access logging when enabled |

Enums: project status/stage, file status, feedback type/status, payment status/line kind, work request status, notification types, etc. (see `prisma/schema.prisma`).

---

## 6. Cross-cutting behavior

| Concern | Implementation |
|---------|------------------|
| Serialization | `lib/serialize.ts` — `Decimal` → numbers for client components |
| Freelancer API auth | `lib/auth.ts` — session + DB user |
| Public token resolution | `lib/public-project.ts` — validate token, rate limit, optional access log |
| Client portal session | `lib/project-client-auth.ts` + `lib/client-portal-session.ts` |
| Upload validation | `lib/file-validation.ts` |
| Email | Templates in `lib/email.ts`; sending + logging in `lib/notify.ts` |

---

## 7. What is **not** (yet) in the product

| Gap | Notes |
|-----|--------|
| **Realtime** | No WebSockets/SSE; dashboard/client rely on navigation or timed `router.refresh()` |
| **Full transactional email to portal clients** | `ProjectClient.email` is stored for future/optional hooks; not every event may email the client yet — verify `lib/notify.ts` + templates per flow |
| **E2E tests** | Vitest unit/lib tests only |
| **Global middleware** | Route handlers and server components enforce auth (no single `middleware.ts` for all rules) |
| **README drift** | `README.md` may still mention Cloudinary in places; storage path is Supabase when env is set |

---

## 8. Environment variables (typical)

**Core:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`

**Client portal cookie signing:** `CLIENT_PORTAL_SECRET` (optional if `NEXTAUTH_SECRET` is set and long enough)

**Storage:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; bucket `project-files`

**Email:** `RESEND_API_KEY`, `EMAIL_FROM`

**Rate limits (multi-instance):** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Seed (optional):** `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`

---

## 9. Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run db:push` | Apply Prisma schema |
| `npm run seed` | Seed user |
| `npm run db:setup` | `db:push` + `seed` |
| `npm test` | Vitest |

---

## 10. Related docs

- `README.md` — install, env template, local dev  
- `SYSTEM_DESIGN.md` — architecture / flows (may predate portal accounts; cross-check)  
- `detail_project.md` — product notes / roadmap ideas  
- `PROGRESS.md` — historical progress log (if maintained)

---

*Update this file when you ship major features (e.g. realtime, client email coverage, E2E tests).*
