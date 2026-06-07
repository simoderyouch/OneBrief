import { prisma } from "@/lib/prisma";
import { summarizePaymentProgress } from "@/lib/payment-gate";

export type ClientSummary = {
  clientEmail: string;
  clientName: string | null;
  projectCount: number;
  activeProjects: number;
  totalQuoted: number;
  totalPaid: number;
  outstanding: number;
  lastActivity: Date | null;
  notes: string | null;
};

export async function getClientSummaries(userId: string): Promise<ClientSummary[]> {
  const projects = await prisma.project.findMany({
    where: { userId, clientEmail: { not: null } },
    include: {
      payments: true,
      accessLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      feedback: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const notes = await prisma.clientNote.findMany({ where: { userId } });
  const notesByEmail = new Map(notes.map((n) => [n.clientEmail.toLowerCase(), n]));

  const byEmail = new Map<string, ClientSummary>();

  for (const p of projects) {
    const email = (p.clientEmail || "").toLowerCase();
    if (!email) continue;

    const progress = summarizePaymentProgress(p.payments);
    const lastAccess = p.accessLogs[0]?.createdAt ?? null;
    const lastFeedback = p.feedback[0]?.createdAt ?? null;
    const lastActivity =
      lastAccess && lastFeedback
        ? lastAccess > lastFeedback
          ? lastAccess
          : lastFeedback
        : lastAccess || lastFeedback;

    const existing = byEmail.get(email);
    const isActive = !["ARCHIVED", "CANCELLED", "COMPLETED"].includes(p.status);

    if (existing) {
      existing.projectCount += 1;
      if (isActive) existing.activeProjects += 1;
      existing.totalQuoted += Number(p.totalPrice || progress.total);
      existing.totalPaid += progress.paid;
      existing.outstanding += progress.outstanding;
      if (lastActivity && (!existing.lastActivity || lastActivity > existing.lastActivity)) {
        existing.lastActivity = lastActivity;
      }
      if (!existing.clientName && p.clientName) existing.clientName = p.clientName;
    } else {
      const note = notesByEmail.get(email);
      byEmail.set(email, {
        clientEmail: email,
        clientName: p.clientName || note?.clientName || null,
        projectCount: 1,
        activeProjects: isActive ? 1 : 0,
        totalQuoted: Number(p.totalPrice || progress.total),
        totalPaid: progress.paid,
        outstanding: progress.outstanding,
        lastActivity,
        notes: note?.notes ?? null,
      });
    }
  }

  return Array.from(byEmail.values()).sort((a, b) => {
    const ta = a.lastActivity?.getTime() ?? 0;
    const tb = b.lastActivity?.getTime() ?? 0;
    return tb - ta;
  });
}

export async function upsertClientNote(
  userId: string,
  clientEmail: string,
  data: { clientName?: string; notes?: string }
) {
  return prisma.clientNote.upsert({
    where: { userId_clientEmail: { userId, clientEmail: clientEmail.toLowerCase() } },
    create: {
      userId,
      clientEmail: clientEmail.toLowerCase(),
      clientName: data.clientName,
      notes: data.notes,
    },
    update: {
      clientName: data.clientName,
      notes: data.notes,
    },
  });
}
