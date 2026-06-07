# OneBrief — Full Freelance Portal Vision

> **Goal:** A complete personal freelance command center — project management, client collaboration, statistics, and professional file protection — **without processing payments inside the portal**.

---

## Table of contents

1. [Vision & principles](#1-vision--principles)
2. [What exists today (MVP)](#2-what-exists-today-mvp)
3. [Payment philosophy — track, never charge](#3-payment-philosophy--track-never-charge)
4. [Full project management](#4-full-project-management)
5. [Client portal (professional experience)](#5-client-portal-professional-experience)
6. [Statistics & business insights](#6-statistics--business-insights)
7. [Professional protection (deep dive)](#7-professional-protection-deep-dive)
8. [Communication & notifications](#8-communication--notifications)
9. [Studio settings & branding](#9-studio-settings--branding)
10. [Automation & smart workflows](#10-automation--smart-workflows)
11. [Technical roadmap (phased)](#11-technical-roadmap-phased)
12. [What NOT to build (scope guardrails)](#12-what-not-to-build-scope-guardrails)
13. [Per-client setup checklist](#13-per-client-setup-checklist)

---

## 1. Vision & principles

### One-line vision

> **One studio, many clients, one link each — you control what they see, download, and approve. Money stays outside the app; everything else lives inside.**

### Design principles

| Principle | Meaning |
|-----------|---------|
| **Personal first** | Built for *your* freelance work, not a public SaaS marketplace |
| **No in-portal payments** | No Stripe, PayPal, card forms, or checkout. You record payments manually after bank transfer / cash / external invoice |
| **Protection by default** | Clients preview work; finals unlock only when *you* say so |
| **Structured over chat** | Feedback, revisions, and scope live in the portal — not WhatsApp |
| **Honest limits** | Watermarks and download gates deter misuse; they cannot stop a determined screenshot |
| **Data you own** | PostgreSQL + your Supabase bucket — no vendor lock-in on client relationships |

### Who uses what

```
┌─────────────────────────────────────────────────────────────┐
│  YOU (freelancer)                                           │
│  Dashboard · stats · uploads · payment log · link control   │
└──────────────────────────┬──────────────────────────────────┘
                           │ one secret link per project
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (per project)                                       │
│  View progress · preview files · feedback · scope requests  │
│  See payment status (read-only) · never pays inside app     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. What exists today (MVP)

Use this as the baseline. Everything below is **additive**.

| Area | Status |
|------|--------|
| Freelancer auth (login / register) | ✅ Done |
| Project CRUD + dashboard | ✅ Done |
| Stages: Brief → Design → Review → Finals | ✅ Done |
| File upload + auto versioning (v1, v2, v3…) | ✅ Done |
| Client portal `/p/[token]` | ✅ Done |
| Per-file share links `/s/[token]` | ✅ Done |
| Security tiers: Basic / Standard / Protected | ✅ Done |
| Download toggles + watermarked image previews | ✅ Done |
| File access audit log (Standard/Protected) | ✅ Done |
| Structured feedback + resolve workflow | ✅ Done |
| Work requests (scope change) + quote flow | ✅ Done |
| Payment milestones (manual status: pending / paid / overdue) | ✅ Done |
| Email notifications (Resend) | ✅ Done |
| Rate limiting | ✅ Done |
| Studio settings (profile, notification prefs) | ✅ Done |

**Gaps the vision below fills:** analytics, CRM-style client view, deliverable packages, approval workflows, protection rules tied to payment status, calendar, templates, exports, and a richer freelancer home dashboard.

---

## 3. Payment philosophy — track, never charge

### What “no payment inside the portal” means

**Include (tracking only):**
- Project total price + currency
- Milestones: deposit, progress payment, final balance
- Manual status: `PENDING` → `PAID` / `OVERDUE` / `CANCELLED`
- Client sees **what is owed and what is paid** (transparency)
- Work-request quotes that become payment lines when accepted
- Optional: attach external invoice PDF (upload, not generate)

**Exclude (never build for personal portal):**
- Stripe / PayPal / card checkout
- Automatic charge on milestone due date
- Subscription billing for your clients
- Tax calculation / legal invoicing engine
- Escrow or hold funds

### Suggested enhancement: “Payment gate” (manual trigger)

Link file access to **your** payment records — still no money in the app:

```
Rule (configurable per project):
  IF milestone "Final 50%" status ≠ PAID
  THEN all files stay: preview-only, download OFF, not FINAL

When YOU mark milestone PAID in dashboard:
  → Option A: notify you to unlock finals manually
  → Option B: auto-enable download on files tagged "final-deliverables"
```

This gives you **professional protection + payment alignment** without processing payments.

---

## 4. Full project management

### 4.1 Project lifecycle

Expand beyond status + stage with a clear pipeline:

| Phase | Freelancer actions | Client sees |
|-------|-------------------|-------------|
| **Lead / Quote** | Internal only; optional draft project | Nothing yet |
| **Active** | Upload WIP, collect feedback | Progress + previews |
| **Review** | Round N deliverables, feedback inbox | Comment on specific files |
| **Approval pending** | Wait for explicit approve | Approve / request changes button |
| **Final delivery** | Unlock downloads after payment logged | Download finals |
| **Completed** | Archive; link read-only or revoked | Summary + thank you |
| **On hold** | Pause timers; hide new uploads | “Project paused” banner |
| **Cancelled** | Revoke link; keep internal records | Access denied |

**New fields to consider:**
- `startedAt`, `completedAt`, `archivedAt`
- `estimatedHours` vs `loggedHours` (optional time tracking)
- `tags` (logo, web, branding, rush)
- `priority` (low / normal / high)
- `revisionRound` (auto-increment on each upload batch)

### 4.2 Deliverable packages

Group files into **packages** clients understand:

```
Project: Brand Identity — Acme Co.
├── Package: Logo explorations     [preview only, round 2]
├── Package: Color & typography    [preview only]
├── Package: Final brand kit       [locked until Final 50% PAID]
└── Package: Source files          [locked until 100% PAID]
```

Each package has:
- Name + description
- Files inside
- Default security (preview / download / hidden)
- Optional link to a payment milestone

### 4.3 Revision management

| Feature | Description |
|---------|-------------|
| **Revision rounds** | Auto-label uploads: “Round 1”, “Round 2” with changelog note |
| **Compare versions** | Side-by-side for images (v1 vs v2) |
| **Revision limit** | Show client “2 of 3 revisions included” (from project settings) |
| **Superseded history** | Freelancer sees full tree; client sees latest only |
| **Changelog per round** | Short note: “Adjusted spacing per feedback #12” |

### 4.4 Brief & scope

| Feature | Description |
|---------|-------------|
| **Structured brief** | Form: goals, audience, references, deliverables list, deadline |
| **Scope document** | What’s included / excluded (client read-only) |
| **Scope freeze** | After sign-off, new work goes through Work Requests only |
| **Reference board** | Client uploads inspiration (size-limited) |

### 4.5 Approval workflow

Structured client decisions instead of “looks good” in chat:

```
Client actions per file or package:
  [ Approve ]  [ Request changes ]  [ Ask a question ]

Freelancer dashboard:
  → Approval inbox
  → Filter: pending approval / changes requested
  → Mark round complete → start next revision
```

### 4.6 Internal freelancer tools

| Feature | Description |
|---------|-------------|
| **Internal notes** | Already exists per project — extend to per-file |
| **Private checklist** | Deliverables todo (not visible to client) |
| **Time log** | Optional: log hours per project for your own stats |
| **Project duplicate** | Clone structure for similar client |
| **Templates** | “Logo project”, “Website”, “Social pack” presets |

### 4.7 Client CRM (lightweight)

One view of **all clients across projects**:

| Field | Use |
|-------|-----|
| Client name + email | From project |
| Projects count | Active / completed |
| Total quoted | Sum of `totalPrice` |
| Total paid | Sum of PAID milestones |
| Last activity | Last portal visit or feedback |
| Notes | “Pays late”, “ prefers WhatsApp for urgent” |

No separate CRM product — just a **Clients** page aggregating project data.

---

## 5. Client portal (professional experience)

### 5.1 First impression

- Clean hero: project title, your studio name, current stage
- Progress bar across stages (Brief → Design → Review → Finals)
- “Last updated” timestamp
- Optional welcome message from you (per project)

### 5.2 What clients can do

| Action | Notes |
|--------|-------|
| View deliverables | Grouped by package / round |
| Preview files | Watermarked when Protected + not final |
| Download | Only when you enabled it |
| Leave feedback | Pin to file + general project feedback |
| Approve / request changes | Structured buttons |
| See payment status | Read-only ledger — **no pay button** |
| Request extra scope | Work request → you quote → they accept/decline |
| View scope & brief | Read-only project definition |

### 5.3 What clients cannot do

- Pay inside the portal
- See other clients’ projects
- Access raw storage URLs
- Download without permission
- See internal notes or revision history (old versions)

### 5.4 Optional client identity

Today: one signup per project link. Future options:
- Optional display name on feedback (“Sarah from Marketing”)
- Multiple stakeholders on same link (shared rate limit — document honestly)
- Email on feedback for follow-up

### 5.5 Professional touchpoints

- Branded portal header (your logo, colors)
- Custom message when project completes
- “Download all finals” zip (only when all gates pass)
- PDF project summary export for client records

---

## 6. Statistics & business insights

### 6.1 Home dashboard (freelancer)

At-a-glance when you log in:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Active       │ Awaiting     │ Overdue      │ Feedback     │
│ projects: 4  │ approval: 2  │ payments: 1  │ unread: 5    │
└──────────────┴──────────────┴──────────────┴──────────────┘

Recent activity feed:
  • Acme — client viewed Logo v3 (2h ago)
  • Beta Co — feedback on homepage mockup
  • Gamma — milestone “Deposit” marked PAID
```

### 6.2 Project-level stats

| Metric | Source |
|--------|--------|
| Portal visits | `access_logs` |
| File views / downloads | `file_access_logs` |
| Feedback count + avg resolution time | `feedback` |
| Revision rounds | File version count |
| Days in current stage | `updatedAt` + stage history |
| Payment progress | paid / total |
| Work requests | open / quoted / accepted |

### 6.3 Business analytics (year view)

For your personal freelance business:

| Report | Purpose |
|--------|---------|
| **Revenue tracked** | Sum of PAID milestones by month/quarter/year |
| **Outstanding** | PENDING + OVERDUE by client |
| **Projects by status** | Active vs completed vs cancelled |
| **Average project duration** | Start → complete |
| **Average revisions per project** | Scope creep signal |
| **Busiest clients** | By feedback volume or file views |
| **Service mix** | Projects by `serviceType` tag |
| **Win rate on quotes** | Work requests accepted vs declined |

### 6.4 Protection analytics

| Report | Purpose |
|--------|---------|
| Downloads before final payment | Audit alert (should be zero) |
| Share link usage | Views per link, expired/revoked |
| Suspicious activity | Many downloads in short window |
| Files never viewed | Nudge client reminder |

### 6.5 Export

- CSV: projects, payments, feedback summary (for your accountant)
- PDF: monthly business snapshot
- Per-project: activity log for disputes

---

## 7. Professional protection (deep dive)

This is the core reason you built OneBrief. Expand in layers.

### 7.1 Security tiers (current + future)

| Tier | Today | Future enhancements |
|------|-------|---------------------|
| **Basic** | App-served files, revoke link | + IP allowlist optional |
| **Standard** | Download toggle + audit log | + download approval request from client |
| **Protected** | Watermarked image previews | + PDF watermark, video poster-only |

### 7.2 Download policy engine

Configurable rules per project:

```yaml
default_policy:
  work_in_progress: preview_only
  approved_not_paid: preview_only
  final_paid: download_allowed

file_status_rules:
  CURRENT: download_off
  FINAL: download_if_milestone_paid("final")
  
exceptions:
  - file: "Brand guidelines PDF"
    allow_download_after: milestone("deposit_paid")
```

You always have **override** in the dashboard.

### 7.3 Release workflow (recommended)

```
Upload v2 logo
  → clientVisible: true
  → downloadAllowed: false
  → status: CURRENT
  → tier PROTECTED → watermarked preview

Client approves + you mark "Final 50%" PAID
  → you set status: FINAL
  → downloadAllowed: true
  → optional email: "Your finals are ready"

Client downloads
  → logged in audit (IP, time, user agent)
```

### 7.4 Link controls

| Control | Use case |
|---------|----------|
| Revoke project link | Client relationship ended |
| Regenerate link | Old link leaked |
| Expiry date | Time-limited review window |
| Per-file share link | Send one asset to stakeholder |
| Max views on share link | Limit preview leaks |
| Password on share link (future) | Extra layer for sensitive work |

### 7.5 Content protection by file type

| Type | Protection strategy |
|------|---------------------|
| **Images** | Watermarked preview; full file on download only |
| **PDF** | Server-side preview pages with watermark overlay |
| **Video** | Low-res stream or trailer; no direct file URL |
| **ZIP / source** | Hidden until 100% paid; no preview |
| **Figma / external** | Link out with note — not stored in app |

### 7.6 Anti-leak measures (realistic)

| Measure | Effect |
|---------|--------|
| No raw Supabase URLs in browser | ✅ Already |
| `Cache-Control: no-store` on files | ✅ Already |
| Audit log | Proof of who downloaded when |
| Right-click / drag disabled on preview (UI) | Mild deterrent |
| Dynamic watermark with client name + date | Traceable leak |
| Single-use download tokens (future) | Link expires after one download |

**Be honest:** Screenshots and screen recording cannot be fully prevented. The goal is **professional friction + legal clarity + audit trail**, not DRM.

### 7.7 Legal & clarity (client-facing)

Optional per-project footer:
- “All files remain property of [Studio] until final payment”
- “Previews are watermarked and not licensed for use”
- Link to your terms PDF (upload once in settings)

---

## 8. Communication & notifications

### 8.1 Email triggers (extend current Resend setup)

| Event | Notify freelancer | Notify client |
|-------|-------------------|---------------|
| New feedback | ✅ | — |
| File uploaded | Optional | ✅ “New deliverables ready” |
| Approval requested | — | ✅ |
| Client approved | ✅ | — |
| Payment marked PAID | — | ✅ “Thank you — finals unlocked” |
| Milestone overdue | ✅ | Optional reminder |
| Work request quoted | — | ✅ |
| Link expiring in 3 days | ✅ | ✅ |

### 8.2 In-app notification center

- Bell icon on dashboard
- Mark read / dismiss
- Filter by project

### 8.3 Digest mode (reduce email fatigue)

Daily summary instead of instant email:
- “3 projects had activity today”
- Configurable in studio settings

---

## 9. Studio settings & branding

| Setting | Description |
|---------|-------------|
| Studio name + logo | Shown on client portal |
| Accent color | Portal theme |
| Default currency | MAD, EUR, USD… |
| Default security tier | PROTECTED for new projects |
| Default revision limit | e.g. 3 rounds |
| Email signature | Appended to client emails |
| Terms PDF | Attached or linked on portal |
| Notification preferences | Already started — extend |

---

## 10. Automation & smart workflows

Keep automation **simple** — you’re solo, not running enterprise ops.

| Automation | Trigger → action |
|------------|------------------|
| **Overdue reminder** | Milestone OVERDUE 7 days → email you |
| **Stale project** | No activity 14 days → dashboard badge |
| **Auto-archive** | Completed + 90 days → read-only archive |
| **Unlock suggestion** | Milestone marked PAID → prompt “Unlock final files?” |
| **Revision counter** | New upload same label → increment round |
| **Client nudge** | Files uploaded 3 days ago, zero views → email client |

No AI required for v1 of these — simple cron + rules.

---

## 11. Technical roadmap (phased)

### Phase A — Protection & payment alignment (highest value for you)

- [ ] Payment-gate rules (milestone → file download policy)
- [ ] Deliverable packages
- [ ] Approval workflow (approve / request changes)
- [ ] Dashboard “awaiting action” widgets
- [ ] PDF watermark preview (if you deliver PDFs often)

**Outcome:** Clients cannot easily grab finals without you logging payment.

### Phase B — Management & visibility

- [ ] Freelancer home dashboard with activity feed
- [ ] Project templates
- [ ] Structured brief form
- [ ] Revision rounds + changelog
- [ ] Client list (CRM-lite)
- [ ] Project archive / on-hold states

**Outcome:** One place to run all client work.

### Phase C — Statistics

- [ ] Project stats page (views, downloads, feedback)
- [ ] Business reports (revenue tracked, outstanding, by month)
- [ ] Protection reports (downloads vs payment timeline)
- [ ] CSV / PDF export

**Outcome:** See your freelance business clearly without spreadsheets.

### Phase D — Polish & branding

- [ ] Custom portal branding (logo, colors)
- [ ] Notification center + digest emails
- [ ] “Download all finals” zip
- [ ] Project summary PDF for client
- [ ] Mobile-friendly client portal pass

**Outcome:** Looks like a professional studio product.

### Phase E — Optional later (only if needed)

- [ ] Calendar / deadline view
- [ ] Time tracking
- [ ] Multi-stakeholder names on feedback
- [ ] Webhook / API for external tools
- [ ] Backup export of all project data

---

## 12. What NOT to build (scope guardrails)

Stay focused on **personal freelance portal**. Avoid:

| Skip | Why |
|------|-----|
| Stripe / in-app checkout | You said no payment inside portal |
| Public marketplace | You’re not Fiverr |
| Multi-tenant SaaS billing | Personal tool first |
| Full accounting / tax | Use accountant + exports |
| Real-time chat | Feedback + work requests enough |
| Native mobile apps | Responsive web first |
| AI generation features | Distraction from core workflow |
| Team roles / permissions | Solo freelancer — add only if you hire |

---

## 13. Per-client setup checklist

Copy this when starting each new client project.

### Before sharing the link

- [ ] Create project from template (or blank)
- [ ] Set client name + email
- [ ] Set total price + milestones (deposit / progress / final) — **tracking only**
- [ ] Set security tier: **Protected**
- [ ] Enable payment-gate rules (when built) or manual rule: no FINAL until paid
- [ ] Fill brief + scope document
- [ ] Set deadline + revision limit
- [ ] Upload contract/terms if needed

### During the project

- [ ] Upload WIP with round notes; keep `downloadAllowed: OFF`
- [ ] Respond to feedback; mark resolved
- [ ] Quote extra scope via Work Requests
- [ ] Mark payments PAID when money arrives (bank/PayPal/etc.)
- [ ] Only then: set files FINAL + enable download

### Delivery & close

- [ ] Client approves finals
- [ ] All milestones marked PAID
- [ ] Enable source file package if separate
- [ ] Send “project complete” message
- [ ] Revoke or expire link after 30–90 days
- [ ] Archive project

---

## Summary

OneBrief becomes your **full freelance portal** when you add:

1. **Management** — packages, approvals, revisions, CRM-lite, templates  
2. **Statistics** — activity, revenue tracked, protection audit, exports  
3. **Protection** — payment-aligned gates, watermarks, audit, link control  
4. **Professional client UX** — branded, structured, no WhatsApp chaos  

**Payments stay outside the app.** The portal tracks what’s owed and paid, controls file access, and gives you proof — that’s the professional model for solo freelance work.

---

*Document version: 1.0 — June 2026*  
*Aligned with OneBrief MVP codebase*
