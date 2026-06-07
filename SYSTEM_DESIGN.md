# System design — multi-client feedback & public access

This document describes how the app handles **many clients** and **many feedback submissions**, and where the boundaries are.

## Mental model

| Concept | Implementation |
|--------|------------------|
| **Freelancer** | One `User` row; owns many `Project`s. |
| **Client (business sense)** | Not a login account. Represented by **per-project** fields (`clientName`, `clientEmail`) + a **secret link** (`/p/[token]`). |
| **Isolation** | All client-visible data is scoped by `projectId`. Feedback rows always reference exactly one project. |

So **“multi-client” in the sense of many different customers** = **many projects**, each with its own token. They do not share state in the database.

## Will many clients sending feedback “overload” the app?

**At the data layer: yes, it is designed for it.**

- Each `POST /api/client/[token]/feedback` creates **one** `Feedback` row with that project’s `projectId`. Inserts are independent; there is no global lock across projects.
- **Different projects** = **different rate-limit buckets** (see below). Client A on Project 1 does not consume Client B’s quota on Project 2.
- The freelancer dashboard loads feedback **per project** (`WHERE project_id = …`). That matches how you work (one job at a time in the UI).

**Caveats (honest limits):**

1. **Same project, same shared link**  
   If several people use **one** client link (one token), they are **one logical “public surface”**: rate limiting is **per token**, not per person. They share the same hourly budget (default 100 requests/hour per token). Very chatty teams could hit the limit; raising `PUBLIC_RATE_LIMIT_PER_HOUR` or splitting workflows is the lever.

2. **Who sent it?**  
   `Feedback` does not store a separate “client user id”. Submissions are **anonymous** except project context. If you need “which stakeholder said this”, add an optional **display name** field on the form later (schema + UI).

3. **Email**  
   Each successful feedback POST can trigger **one** email to the freelancer (if `notifyFeedback` + Resend are configured). Many clients on **many projects** ⇒ many emails (expected). Many rapid submissions on **one** project ⇒ many emails (consider digest or throttle in a future iteration).

4. **Production deployment**  
   Rate limiting uses **Upstash Redis** when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set. Without Redis, the in-memory fallback is **per Node process** only — use Redis if you run **multiple** server instances.

## Request path (feedback)

```
Client browser
  → POST /api/client/[token]/feedback
  → resolvePublicProject(token): rate limit by token, validate active link
  → prisma.feedback.create({ projectId })
  → optional: sendFreelancerEmailWithLog (same request; failure is logged on `notifications`)
  → 201 + JSON
```

`logAccess` is **false** for this route so routine feedback does not flood `access_logs` (page views still log when configured elsewhere).

## When to evolve the design

- **Stronger identity per message**: optional `submittedByName` / `clientSessionId` on `Feedback`.
- **Heavy traffic**: queue outbound email (e.g. background job) instead of inline `await sendEmail`.
- **True realtime UI**: WebSocket / SSE / Supabase Realtime (today the dashboard is refresh-based).

This file is a snapshot of intent; keep it aligned when you change `public-project`, rate limits, or the feedback schema.
