# Onebrief

> One brief, one link — structured client work without the group-chat mess.

**Onebrief** is a project management and client collaboration platform for freelance designers and developers. Share files, collect feedback, track payments, and handle scope changes professionally — through a private client portal instead of WhatsApp threads.

## Status (June 2026)

**MVP complete** — bootable locally, production build passes, tests green.

| Area | Status |
|------|--------|
| Freelancer auth (login / register) | Done |
| Project CRUD + dashboard | Done |
| File upload + versioning (Supabase) | Done |
| Client portal (`/p/[token]`) | Done |
| Per-file share links (`/s/[token]`) | Done |
| Security tiers (Basic / Standard / Protected) | Done |
| Feedback + work requests + payments | Done |
| Email notifications (Resend) | Done |
| Rate limiting (memory or Upstash) | Done |

## Features

### Freelancer dashboard
- Create and manage projects with status, stage, deadlines, and pricing
- Upload deliverables with automatic versioning (v1, v2, v3…)
- Three security tiers: link-only, download controls + audit log, watermarked previews
- Per-file share links with expiry, view limits, and revoke
- Structured feedback inbox with resolve workflow
- Payment milestones + change orders from accepted work requests
- Quote and manage extra scope requests from clients
- Client link controls (revoke, regenerate, expiry)
- Studio settings (profile, notification preferences)

### Client portal
- Access via private project link — one-time signup per project
- View deliverables, leave feedback, track payments
- Request extra scope; accept/decline quotes
- Secure file previews and controlled downloads

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database:** PostgreSQL + Prisma 7 (Postgres driver adapter)
- **Auth:** NextAuth.js (Credentials) for freelancers; cookie session for clients
- **Storage:** Supabase Storage
- **Email:** Resend
- **UI:** Tailwind CSS 4
- **Tests:** Vitest

## Getting started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose (local Postgres)
- [Supabase](https://supabase.com) project with a public `project-files` bucket
- [Resend](https://resend.com) account (optional for local dev without emails)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# 4. Create tables + seed a freelancer account
npm run db:setup

# 5. Start dev server
npm run dev
```

Default seed credentials:
- **Email:** `admin@local.test`
- **Password:** `admin1234`

### URLs

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Freelancer login |
| `/register` | Freelancer registration |
| `/dashboard` | Project list |
| `/dashboard/[id]` | Project detail |
| `/dashboard/settings` | Studio settings |
| `/p/[token]` | Client portal |
| `/s/[token]` | Per-file share link |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm test             # Run tests
npm run db:push      # Push schema to database
npm run seed         # Seed freelancer account
npm run db:setup     # db:push + seed
```

## Project structure

```
├── app/
│   ├── (auth)/           # Login & register
│   ├── dashboard/        # Freelancer dashboard
│   ├── p/[token]/        # Client portal
│   ├── s/[token]/        # File share links
│   └── api/              # REST API routes
├── components/
│   ├── dashboard/        # Dashboard UI
│   └── client/           # Client portal UI
├── lib/                  # Auth, files, email, tokens, etc.
├── prisma/schema.prisma  # Database schema
├── tests/                # Vitest unit tests
└── proxy.ts              # Dashboard auth guard
```

## Client access flow

1. Freelancer creates a project → system generates a token (stored hashed in DB)
2. Client opens `/p/[raw-token]` → registers or signs in on that project
3. Client views files, submits feedback, tracks payments, requests extra work
4. Freelancer manages everything from the dashboard

Token URLs accept either a **32-char raw token** (hashed before lookup) or a **64-char stored hash**.

## Environment variables

See [`.env.example`](./.env.example) for the full list. Minimum required for local dev:

- `DATABASE_URL`
- `NEXTAUTH_URL` + `NEXTAUTH_SECRET`
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Email (`RESEND_API_KEY`, `EMAIL_FROM`) is optional locally — uploads and feedback still work without it.

## Deployment

1. Provision PostgreSQL (Supabase, Neon, Railway, etc.)
2. Create Supabase Storage bucket `project-files` (public, 50 MB limit)
3. Set all env vars on your host (Vercel recommended)
4. Run `npm run db:push` against production DB
5. Deploy with `npm run build`

For multi-instance production, set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for shared rate limiting.

## Roadmap (post-MVP)

- Stripe subscription billing
- Multi-tenant / team workspaces
- Custom branding per studio
- Real-time collaboration

See [`detail_project.md`](./detail_project.md) for full product spec.

## License

Personal tool — use and modify freely for your own work.
