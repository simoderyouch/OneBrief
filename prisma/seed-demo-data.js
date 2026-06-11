const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const DEMO_PROJECT_IDS = [
  "00000000-0000-4000-a000-000000000001",
  "00000000-0000-4000-a000-000000000002",
  "00000000-0000-4000-a000-000000000003",
  "00000000-0000-4000-a000-000000000004",
  "00000000-0000-4000-a000-000000000005",
  "00000000-0000-4000-a000-000000000006",
  "00000000-0000-4000-a000-000000000007",
  "00000000-0000-4000-a000-000000000008",
  "00000000-0000-4000-a000-000000000009",
];

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildProjectSlug(projectTitle, clientName) {
  const base = clientName?.trim()
    ? `${clientName.trim()}-${projectTitle.trim()}`
    : projectTitle.trim();
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 48);
}

function buildPortalPath(title, clientName, storedHash) {
  return `${buildProjectSlug(title, clientName)}/${storedHash}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#171717"/>
  <text x="200" y="150" fill="#737373" font-family="system-ui,sans-serif" font-size="14" text-anchor="middle">Demo preview</text>
</svg>`;

async function writePlaceholderFile(projectId, filename) {
  const storagePath = `projects/${projectId}/${filename}`;
  const root = path.resolve(process.env.STORAGE_PATH || path.join(process.cwd(), "storage", "uploads"));
  const full = path.resolve(root, storagePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, PLACEHOLDER_SVG, "utf8");
  return storagePath;
}

/**
 * Rich demo dataset — re-run safe (deletes prior demo projects first).
 */
async function seedDemoData(prisma, userId) {

  await prisma.project.deleteMany({
    where: { id: { in: DEMO_PROJECT_IDS } },
  });

  const expires = daysFromNow(90);

  const scenarios = [
    {
      id: DEMO_PROJECT_IDS[0],
      title: "Acme Brand Identity",
      description: "Full brand system — logo, colors, typography, social templates.",
      serviceType: "Branding",
      status: "IN_PROGRESS",
      stage: "REFINEMENT",
      clientName: "Sarah Chen",
      clientEmail: "sarah@acme.co",
      clientWhatsapp: "212612345678",
      deadline: daysFromNow(12),
      totalPrice: 45000,
      currency: "MAD",
      securityTier: "PROTECTED",
      internalNote: "Sarah prefers minimal marks. Avoid gradients — she mentioned Apple-like restraint.",
      startedAt: daysAgo(18),
      paymentGateEnabled: true,
      paymentGateMode: "DEPOSIT_PAID",
      tags: ["demo-seed", "branding"],
      files: [
        { id: "f-acme-1", label: "Logo concepts v2", format: "svg", status: "CURRENT", approvalStatus: "NONE", clientVisible: true, downloadAllowed: false, versionNumber: 2 },
        { id: "f-acme-2", label: "Moodboard", format: "png", status: "CURRENT", approvalStatus: "PENDING", clientVisible: true, downloadAllowed: true, versionNumber: 1 },
      ],
      payments: [
        { id: "pay-acme-1", label: "Deposit (40%)", amount: 18000, status: "PAID", paidDate: daysAgo(17), lineKind: "MILESTONE" },
        { id: "pay-acme-2", label: "Final delivery", amount: 27000, status: "PENDING", dueDate: daysFromNow(14), lineKind: "MILESTONE" },
      ],
      feedback: [
        { type: "CHANGE_REQUEST", message: "Can we try a sans-serif wordmark instead of the serif lockup?", status: "OPEN", submittedByName: "Sarah", daysBack: 2 },
        { type: "QUESTION", message: "Will we get source files in Figma?", status: "RESOLVED", submittedByName: "Sarah", daysBack: 10 },
      ],
      packages: [{ id: "pkg-acme-1", name: "Brand assets", description: "Logo suite + color specs", sortOrder: 0 }],
      notifications: [
        { type: "FEEDBACK_RECEIVED", title: "New change request", body: "Sarah asked about the wordmark.", read: false, daysBack: 2 },
        { type: "VERSION_UPLOADED", title: "Logo v2 uploaded", body: "You uploaded Logo concepts v2.", read: true, daysBack: 3 },
      ],
      accessLogs: 4,
    },
    {
      id: DEMO_PROJECT_IDS[1],
      title: "Startup Landing Page",
      description: "Marketing site — hero, features, pricing, waitlist.",
      serviceType: "Web Design",
      status: "WAITING_FEEDBACK",
      stage: "CONCEPTS",
      clientName: "Nova Labs",
      clientEmail: "founder@novalabs.io",
      clientWhatsapp: "33612345678",
      deadline: daysFromNow(8),
      totalPrice: 28000,
      currency: "MAD",
      securityTier: "STANDARD",
      startedAt: daysAgo(10),
      paymentGateEnabled: true,
      paymentGateMode: "DEPOSIT_PAID",
      tags: ["demo-seed", "web"],
      files: [
        { id: "f-nova-1", label: "Homepage mockup", format: "png", status: "CURRENT", approvalStatus: "PENDING", clientVisible: true, downloadAllowed: true, versionNumber: 1 },
      ],
      payments: [
        { id: "pay-nova-1", label: "Kickoff deposit", amount: 14000, status: "PAID", paidDate: daysAgo(9), lineKind: "MILESTONE" },
        { id: "pay-nova-2", label: "Launch payment", amount: 14000, status: "PENDING", dueDate: daysFromNow(20), lineKind: "MILESTONE" },
      ],
      feedback: [
        { type: "APPROVAL", message: "Hero section looks great — approved to move to dev handoff.", status: "OPEN", submittedByName: "Alex", daysBack: 1 },
      ],
      notifications: [
        { type: "APPROVAL_RECEIVED", title: "Client approval", body: "Alex approved the hero section.", read: false, daysBack: 1 },
      ],
      accessLogs: 2,
    },
    {
      id: DEMO_PROJECT_IDS[2],
      title: "Restaurant Menu Design",
      description: "Print + QR digital menu for Casablanca bistro.",
      serviceType: "Print Design",
      status: "IN_PROGRESS",
      stage: "FINALS",
      clientName: "Le Riad",
      clientEmail: "contact@leriad.ma",
      clientWhatsapp: "212661112233",
      deadline: daysAgo(2),
      totalPrice: 12000,
      currency: "MAD",
      securityTier: "PROTECTED",
      startedAt: daysAgo(25),
      paymentGateEnabled: true,
      paymentGateMode: "ALL_MILESTONES_PAID",
      tags: ["demo-seed", "overdue"],
      files: [
        { id: "f-riad-1", label: "Menu final print", format: "pdf", status: "FINAL", approvalStatus: "APPROVED", clientVisible: true, downloadAllowed: false, isFinalDeliverable: true, versionNumber: 3 },
      ],
      payments: [
        { id: "pay-riad-1", label: "Deposit", amount: 6000, status: "PAID", paidDate: daysAgo(24), lineKind: "MILESTONE" },
        { id: "pay-riad-2", label: "Final balance", amount: 6000, status: "OVERDUE", dueDate: daysAgo(5), lineKind: "MILESTONE" },
      ],
      feedback: [],
      notifications: [
        { type: "PAYMENT_OVERDUE", title: "Payment overdue", body: "Final balance for Le Riad is overdue.", read: false, daysBack: 0 },
      ],
      accessLogs: 6,
    },
    {
      id: DEMO_PROJECT_IDS[3],
      title: "Fitness App UI Kit",
      description: "Mobile screens + component library delivered.",
      serviceType: "UI/UX",
      status: "COMPLETED",
      stage: "DELIVERY",
      clientName: "FitTrack",
      clientEmail: "product@fittrack.app",
      deadline: daysAgo(30),
      totalPrice: 65000,
      currency: "MAD",
      securityTier: "STANDARD",
      startedAt: daysAgo(60),
      completedAt: daysAgo(28),
      paymentGateEnabled: false,
      paymentGateMode: "NONE",
      tags: ["demo-seed", "completed"],
      files: [
        { id: "f-fit-1", label: "UI kit — handoff", format: "fig", status: "FINAL", approvalStatus: "APPROVED", clientVisible: true, downloadAllowed: true, isFinalDeliverable: true, versionNumber: 1 },
      ],
      payments: [
        { id: "pay-fit-1", label: "Deposit", amount: 32500, status: "PAID", paidDate: daysAgo(58), lineKind: "MILESTONE" },
        { id: "pay-fit-2", label: "Final", amount: 32500, status: "PAID", paidDate: daysAgo(29), lineKind: "MILESTONE" },
      ],
      feedback: [
        { type: "APPROVAL", message: "All screens signed off. Thanks!", status: "RESOLVED", submittedByName: "Jamie", daysBack: 30 },
      ],
      notifications: [
        { type: "MILESTONE_PAID", title: "Final payment received", body: "FitTrack paid the final milestone.", read: true, daysBack: 29 },
      ],
      accessLogs: 12,
    },
    {
      id: DEMO_PROJECT_IDS[4],
      title: "Podcast Cover Art",
      description: "Square cover + YouTube banner — not started yet.",
      serviceType: "Illustration",
      status: "DRAFT",
      stage: "BRIEF",
      clientName: "Night Shift FM",
      clientEmail: "studio@nightshift.fm",
      totalPrice: 8000,
      currency: "MAD",
      securityTier: "BASIC",
      tags: ["demo-seed", "draft"],
      files: [],
      payments: [],
      feedback: [],
      notifications: [],
      accessLogs: 0,
    },
    {
      id: DEMO_PROJECT_IDS[5],
      title: "Real Estate Brochure",
      description: "12-page luxury property brochure — paused by client.",
      serviceType: "Print Design",
      status: "ON_HOLD",
      stage: "CONCEPTS",
      clientName: "Atlas Properties",
      clientEmail: "marketing@atlasproperties.ma",
      clientWhatsapp: "212698887766",
      deadline: daysFromNow(21),
      totalPrice: 22000,
      currency: "MAD",
      onHold: true,
      internalNote: "Client paused until Q3 budget approval. Follow up mid-month.",
      startedAt: daysAgo(14),
      paymentGateEnabled: true,
      paymentGateMode: "DEPOSIT_PAID",
      tags: ["demo-seed", "on-hold"],
      files: [
        { id: "f-atlas-1", label: "Cover concept A", format: "pdf", status: "CURRENT", approvalStatus: "NONE", clientVisible: true, downloadAllowed: false, versionNumber: 1 },
      ],
      payments: [
        { id: "pay-atlas-1", label: "Deposit", amount: 11000, status: "PAID", paidDate: daysAgo(13), lineKind: "MILESTONE" },
        { id: "pay-atlas-2", label: "Balance", amount: 11000, status: "PENDING", dueDate: daysFromNow(30), lineKind: "MILESTONE" },
      ],
      feedback: [
        { type: "QUESTION", message: "Can we pause until our budget meeting?", status: "OPEN", submittedByName: "Nadia", daysBack: 5 },
      ],
      notifications: [],
      accessLogs: 1,
    },
    {
      id: DEMO_PROJECT_IDS[6],
      title: "Tech Conference Poster",
      description: "A1 poster + social variants — active revision round.",
      serviceType: "Poster Design",
      status: "IN_REVISION",
      stage: "REFINEMENT",
      clientName: "DevSummit MA",
      clientEmail: "events@devsummit.ma",
      deadline: daysFromNow(5),
      totalPrice: 15000,
      currency: "MAD",
      revisionRound: 2,
      revisionLimit: 3,
      startedAt: daysAgo(8),
      paymentGateEnabled: true,
      paymentGateMode: "SPECIFIC_MILESTONE",
      tags: ["demo-seed", "revision"],
      files: [
        { id: "f-dev-1", label: "Poster v2", format: "pdf", status: "CURRENT", approvalStatus: "CHANGES_REQUESTED", clientVisible: true, downloadAllowed: false, versionNumber: 2 },
        { id: "f-dev-0", label: "Poster v1", format: "pdf", status: "SUPERSEDED", approvalStatus: "NONE", clientVisible: false, downloadAllowed: false, versionNumber: 1 },
      ],
      payments: [
        { id: "pay-dev-1", label: "Deposit", amount: 7500, status: "PAID", paidDate: daysAgo(7), lineKind: "MILESTONE" },
        { id: "pay-dev-2", label: "Final", amount: 7500, status: "PENDING", dueDate: daysFromNow(7), lineKind: "MILESTONE" },
        { id: "pay-dev-3", label: "Extra: sponsor strip", amount: 2500, status: "PENDING", dueDate: daysFromNow(10), lineKind: "CHANGE_ORDER" },
      ],
      feedback: [
        { type: "CHANGE_REQUEST", message: "Speaker photos need to be larger on the poster.", status: "OPEN", submittedByName: "Karim", daysBack: 1 },
        { type: "CHANGE_REQUEST", message: "Use the dark background from v1 but keep v2 layout.", status: "IN_PROGRESS", submittedByName: "Karim", daysBack: 3 },
      ],
      workRequests: [
        {
          id: "wr-dev-1",
          title: "Add sponsor logo strip",
          description: "Bottom banner with 4 sponsor logos supplied by client.",
          status: "QUOTED",
          quotedAmount: 2500,
          quotedNote: "Includes one revision round for logo placement.",
          submittedByName: "Karim",
          messages: [
            { fromClient: true, body: "We got new sponsors — can you add a strip at the bottom?", daysBack: 4 },
            { fromClient: false, body: "Yes — quoted 2,500 MAD as an add-on. Accept in the portal when ready.", daysBack: 3 },
          ],
        },
        {
          id: "wr-dev-2",
          title: "Instagram story format",
          description: "Need 9:16 variant of the poster for stories.",
          status: "PENDING",
          submittedByName: "Karim",
          messages: [{ fromClient: true, body: "Can we also get a story size?", daysBack: 1 }],
        },
      ],
      notifications: [
        { type: "FEEDBACK_RECEIVED", title: "Revision feedback", body: "Karim requested layout changes.", read: false, daysBack: 1 },
        { type: "WHATSAPP_NUDGE", title: "WhatsApp nudge sent", body: "Reminder sent to DevSummit MA.", read: true, daysBack: 2 },
      ],
      accessLogs: 5,
    },
    {
      id: DEMO_PROJECT_IDS[7],
      title: "Legacy Logo Refresh (2024)",
      description: "Archived — completed last year.",
      serviceType: "Branding",
      status: "ARCHIVED",
      stage: "DELIVERY",
      clientName: "Old Client Co",
      clientEmail: "hello@oldclient.co",
      totalPrice: 10000,
      currency: "MAD",
      archivedAt: daysAgo(120),
      completedAt: daysAgo(150),
      startedAt: daysAgo(180),
      tags: ["demo-seed", "archived"],
      files: [],
      payments: [
        { id: "pay-old-1", label: "Full payment", amount: 10000, status: "PAID", paidDate: daysAgo(155), lineKind: "MILESTONE" },
      ],
      feedback: [],
      notifications: [],
      accessLogs: 0,
    },
    {
      id: DEMO_PROJECT_IDS[8],
      title: "Wedding Invitation Suite",
      description: "Inbound lead — waiting for brief and quote sign-off.",
      serviceType: "Print Design",
      status: "LEAD",
      stage: "BRIEF",
      clientName: "Amira & Omar",
      clientEmail: "amira.wedding@gmail.com",
      clientWhatsapp: "212677889900",
      totalPrice: 18000,
      currency: "MAD",
      tags: ["demo-seed", "lead"],
      files: [],
      payments: [
        { id: "pay-wed-1", label: "Proposed deposit", amount: 9000, status: "PENDING", dueDate: daysFromNow(14), lineKind: "MILESTONE" },
      ],
      feedback: [],
      notifications: [],
      accessLogs: 0,
    },
  ];

  const portalLinks = [];

  for (const s of scenarios) {
    const storedToken = hashToken(`demo-portal-${s.id}`);
    const storagePaths = {};
    for (const f of s.files) {
      storagePaths[f.id] = await writePlaceholderFile(s.id, `${f.label.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.${f.format}`);
    }

    const depositPayment = s.payments.find((p) => p.label.toLowerCase().includes("deposit") || p.id.endsWith("-1"));
    const finalPayment = s.payments.find((p) => p.label.toLowerCase().includes("final") || p.status === "OVERDUE");
    const gateMilestoneId =
      s.paymentGateMode === "SPECIFIC_MILESTONE"
        ? finalPayment?.id ?? depositPayment?.id
        : depositPayment?.id ?? s.payments[0]?.id ?? null;

    await prisma.project.create({
      data: {
        id: s.id,
        userId,
        title: s.title,
        description: s.description,
        serviceType: s.serviceType,
        status: s.status,
        stage: s.stage,
        deadline: s.deadline,
        totalPrice: s.totalPrice,
        currency: s.currency,
        clientName: s.clientName,
        clientEmail: s.clientEmail,
        clientWhatsapp: s.clientWhatsapp,
        token: storedToken,
        tokenActive: s.status !== "DRAFT",
        tokenExpiresAt: expires,
        securityTier: s.securityTier ?? "PROTECTED",
        internalNote: s.internalNote,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        archivedAt: s.archivedAt,
        onHold: s.onHold ?? false,
        revisionRound: s.revisionRound ?? 0,
        revisionLimit: s.revisionLimit ?? 3,
        paymentGateEnabled: s.paymentGateEnabled ?? true,
        paymentGateMode: s.paymentGateMode ?? "DEPOSIT_PAID",
        paymentGateMilestoneId: gateMilestoneId,
        autoUnlockOnPayment: true,
        tags: s.tags ?? ["demo-seed"],
        createdAt: s.startedAt ?? daysAgo(3),
        updatedAt: daysAgo(0),
      },
    });

    for (const p of s.payments) {
      await prisma.payment.create({
        data: {
          id: p.id,
          projectId: s.id,
          label: p.label,
          amount: p.amount,
          currency: s.currency ?? "MAD",
          status: p.status,
          dueDate: p.dueDate,
          paidDate: p.paidDate,
          lineKind: p.lineKind ?? "MILESTONE",
          createdAt: daysAgo(20),
        },
      });
    }

    if (s.packages) {
      for (const pkg of s.packages) {
        await prisma.deliverablePackage.create({
          data: {
            id: pkg.id,
            projectId: s.id,
            name: pkg.name,
            description: pkg.description,
            sortOrder: pkg.sortOrder ?? 0,
            paymentId: s.payments.find((p) => p.status === "PENDING")?.id,
          },
        });
      }
    }

    for (const f of s.files) {
      const sp = storagePaths[f.id];
      await prisma.file.create({
        data: {
          id: f.id,
          projectId: s.id,
          packageId: s.packages?.[0]?.id,
          label: f.label,
          cloudinaryUrl: sp,
          publicId: sp,
          format: f.format,
          mimeType: f.format === "svg" ? "image/svg+xml" : "application/octet-stream",
          sizeBytes: 2048,
          versionNumber: f.versionNumber,
          status: f.status,
          approvalStatus: f.approvalStatus ?? "NONE",
          isFinalDeliverable: f.isFinalDeliverable ?? false,
          clientVisible: f.clientVisible ?? true,
          downloadAllowed: f.downloadAllowed ?? false,
          uploadedAt: daysAgo(5 - f.versionNumber),
        },
      });
    }

    for (const fb of s.feedback) {
      const fileId = s.files[0]?.id;
      await prisma.feedback.create({
        data: {
          projectId: s.id,
          fileId: fb.type !== "QUESTION" ? fileId : undefined,
          type: fb.type,
          message: fb.message,
          status: fb.status,
          submittedByName: fb.submittedByName,
          submittedBySessionId: "demo-session",
          createdAt: daysAgo(fb.daysBack),
          resolvedAt: fb.status === "RESOLVED" ? daysAgo(fb.daysBack - 1) : undefined,
        },
      });
    }

    for (const n of s.notifications ?? []) {
      await prisma.notification.create({
        data: {
          projectId: s.id,
          type: n.type,
          sentTo: "FREELANCER",
          email: process.env.SEED_USER_EMAIL || "admin@local.test",
          title: n.title,
          body: n.body,
          deliveryStatus: "SENT",
          readAt: n.read ? daysAgo(n.daysBack) : null,
          sentAt: daysAgo(n.daysBack),
        },
      });
    }

    for (let i = 0; i < (s.accessLogs ?? 0); i++) {
      await prisma.accessLog.create({
        data: {
          projectId: s.id,
          ipAddress: "127.0.0.1",
          userAgent: "DemoSeed/1.0",
          createdAt: daysAgo(i + 1),
        },
      });
    }

    for (const wr of s.workRequests ?? []) {
      await prisma.workRequest.create({
        data: {
          id: wr.id,
          projectId: s.id,
          title: wr.title,
          description: wr.description,
          status: wr.status,
          quotedAmount: wr.quotedAmount,
          quotedNote: wr.quotedNote,
          submittedByName: wr.submittedByName,
          submittedBySessionId: "demo-session",
          createdAt: daysAgo(5),
          messages: {
            create: wr.messages.map((m) => ({
              fromClient: m.fromClient,
              body: m.body,
              createdAt: daysAgo(m.daysBack),
            })),
          },
        },
      });
    }

    portalLinks.push({
      title: s.title,
      status: s.status,
      scenario: describeScenario(s),
      dashboard: `/dashboard/${s.id}`,
      clientPortal:
        s.status !== "DRAFT"
          ? `/p/${buildPortalPath(s.title, s.clientName, storedToken)}`
          : "(draft — link inactive)",
    });
  }

  await prisma.clientNote.upsert({
    where: {
      userId_clientEmail: { userId, clientEmail: "sarah@acme.co" },
    },
    update: { notes: "Repeat client — prefers async feedback. WhatsApp OK after 6pm." },
    create: {
      userId,
      clientEmail: "sarah@acme.co",
      clientName: "Sarah Chen",
      notes: "Repeat client — prefers async feedback. WhatsApp OK after 6pm.",
    },
  });

  await prisma.projectTemplate.upsert({
    where: { id: "00000000-0000-4000-b000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-b000-000000000001",
      userId,
      name: "Brand identity package",
      description: "Logo, colors, typography, social templates",
      serviceType: "Branding",
      defaultRevisionLimit: 3,
      defaultSecurityTier: "PROTECTED",
    },
  });

  return portalLinks;
}

function describeScenario(s) {
  if (s.status === "IN_PROGRESS" && s.payments.some((p) => p.status === "PAID")) return "Active · deposit paid · open feedback";
  if (s.status === "WAITING_FEEDBACK") return "Waiting on client approval";
  if (s.payments.some((p) => p.status === "OVERDUE")) return "Overdue final payment · gated files";
  if (s.status === "COMPLETED") return "Fully paid · completed";
  if (s.status === "DRAFT") return "Draft · not shared yet";
  if (s.onHold) return "On hold · internal note";
  if (s.status === "IN_REVISION") return "Revision round · work requests · change order";
  if (s.status === "ARCHIVED") return "Archived historical project";
  if (s.status === "LEAD") return "Lead · quote pending";
  return s.status;
}

module.exports = { seedDemoData, DEMO_PROJECT_IDS };
