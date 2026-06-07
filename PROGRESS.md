# Onebrief — Implementation Progress

**Last updated:** June 2026  
**Overall MVP status:** Complete

---

## Phase 1: MVP — Complete

| Feature | Status |
|---------|--------|
| Next.js 16 + TypeScript + Tailwind 4 | Done |
| PostgreSQL + Prisma 7 schema | Done |
| Freelancer auth (NextAuth credentials) | Done |
| Registration + login pages | Done |
| Dashboard layout + project list | Done |
| Project create / edit / delete | Done |
| Project detail (status, stage, token controls) | Done |
| File upload (Supabase Storage) | Done |
| File versioning (CURRENT / SUPERSEDED / FINAL) | Done |
| Security tiers (Basic / Standard / Protected) | Done |
| Per-file share links (`/s/[token]`) | Done |
| File access audit log | Done |
| Client portal (`/p/[token]`) | Done |
| Client registration + login per project | Done |
| Structured feedback (change / approval / question) | Done |
| Payment milestones + overdue tracking | Done |
| Work requests (quote → accept → payment line) | Done |
| Email notifications (Resend + delivery log) | Done |
| Rate limiting (memory + optional Upstash) | Done |
| Studio settings (profile, notifications) | Done |
| Landing page | Done |
| Unit tests (21 passing) | Done |
| Production build | Done |

---

## Phase 2: SaaS — Not started

- [ ] Multi-tenant architecture
- [ ] Stripe subscription billing
- [ ] Custom branding per account
- [ ] Marketing / pricing landing page

## Phase 3: Advanced — Not started

- [ ] Team workspaces + roles
- [ ] Real-time collaboration
- [ ] AI-assisted feedback summaries

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16, React 19, TypeScript |
| Database | PostgreSQL + Prisma 7 |
| Auth | NextAuth (freelancers), cookie session (clients) |
| Storage | Supabase Storage |
| Email | Resend |
| UI | Tailwind CSS 4 |
| Tests | Vitest |
| Deploy target | Vercel |

---

## Key routes

```
/                     Landing
/login, /register     Freelancer auth
/dashboard            Project list
/dashboard/[id]       Project detail
/dashboard/settings   Studio settings
/p/[token]            Client portal
/s/[token]            File share link
```

33 API routes under `/api/*` — see `npm run build` output for full list.

---

## Local dev checklist

```bash
docker compose up -d
cp .env.example .env.local   # fill in values
npm install
npm run db:setup
npm run dev
```

Login: `admin@local.test` / `admin1234`
