import { prisma } from "@/lib/prisma";
import { countOverduePayments, summarizePaymentProgress } from "@/lib/payment-gate";

export async function getDashboardStats(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId, status: { notIn: ["ARCHIVED", "CANCELLED"] } },
    include: {
      feedback: { where: { status: "OPEN" } },
      payments: true,
      files: { where: { deletedAt: null, approvalStatus: "PENDING" } },
    },
  });

  const allPayments = projects.flatMap((p) => p.payments);
  const revenue = summarizePaymentProgress(allPayments);

  const overduePayments = countOverduePayments(allPayments);
  const openFeedback = projects.reduce((n, p) => n + p.feedback.length, 0);
  const pendingApprovals = projects.reduce((n, p) => n + p.files.length, 0);
  const activeProjects = projects.filter(
    (p) => !p.onHold && !["DRAFT", "LEAD", "COMPLETED"].includes(p.status)
  ).length;
  const onHold = projects.filter((p) => p.onHold).length;

  const unreadNotifications = await prisma.notification.count({
    where: {
      sentTo: "FREELANCER",
      readAt: null,
      project: { userId },
    },
  });

  return {
    activeProjects,
    onHold,
    openFeedback,
    pendingApprovals,
    overduePayments,
    unreadNotifications,
    revenueTracked: revenue.paid,
    outstanding: revenue.outstanding,
    totalQuoted: revenue.total,
  };
}

export async function getRecentActivity(userId: string, limit = 15) {
  const [accessLogs, feedback, notifications] = await Promise.all([
    prisma.accessLog.findMany({
      where: { project: { userId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { project: { select: { id: true, title: true } } },
    }),
    prisma.feedback.findMany({
      where: { project: { userId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { project: { select: { id: true, title: true } } },
    }),
    prisma.notification.findMany({
      where: { project: { userId }, sentTo: "FREELANCER" },
      orderBy: { sentAt: "desc" },
      take: limit,
      include: { project: { select: { id: true, title: true } } },
    }),
  ]);

  type Activity = {
    id: string;
    at: Date;
    kind: string;
    label: string;
    projectId: string;
    projectTitle: string;
  };

  const items: Activity[] = [
    ...accessLogs.map((a) => ({
      id: `access-${a.id}`,
      at: a.createdAt,
      kind: "visit",
      label: "Client visited portal",
      projectId: a.project.id,
      projectTitle: a.project.title,
    })),
    ...feedback.map((f) => ({
      id: `feedback-${f.id}`,
      at: f.createdAt,
      kind: "feedback",
      label: `${f.type.replace("_", " ")} feedback`,
      projectId: f.project.id,
      projectTitle: f.project.title,
    })),
    ...notifications.map((n) => ({
      id: `notif-${n.id}`,
      at: n.sentAt,
      kind: "notification",
      label: n.title || n.type,
      projectId: n.project.id,
      projectTitle: n.project.title,
    })),
  ];

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export type AttentionItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  type: "overdue_payment" | "open_feedback" | "pending_approval" | "on_hold" | "waiting_client";
  label: string;
  severity: "warn" | "info";
};

export async function getAttentionItems(userId: string, limit = 10): Promise<AttentionItem[]> {
  const projects = await prisma.project.findMany({
    where: { userId, status: { notIn: ["ARCHIVED", "CANCELLED", "COMPLETED"] } },
    include: {
      feedback: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
      payments: true,
      files: { where: { deletedAt: null, approvalStatus: "PENDING" } },
    },
  });

  const items: AttentionItem[] = [];

  for (const p of projects) {
    if (p.onHold) {
      items.push({
        id: `hold-${p.id}`,
        projectId: p.id,
        projectTitle: p.title,
        type: "on_hold",
        label: "On hold — resume when ready",
        severity: "info",
      });
    }

    for (const pay of p.payments.filter((x) => x.status === "OVERDUE")) {
      items.push({
        id: `overdue-${pay.id}`,
        projectId: p.id,
        projectTitle: p.title,
        type: "overdue_payment",
        label: `Overdue payment: ${pay.label}`,
        severity: "warn",
      });
    }

    if (p.feedback.length > 0) {
      items.push({
        id: `feedback-${p.id}`,
        projectId: p.id,
        projectTitle: p.title,
        type: "open_feedback",
        label: `${p.feedback.length} open feedback item${p.feedback.length > 1 ? "s" : ""}`,
        severity: "warn",
      });
    }

    if (p.files.length > 0) {
      items.push({
        id: `approval-${p.id}`,
        projectId: p.id,
        projectTitle: p.title,
        type: "pending_approval",
        label: `${p.files.length} file${p.files.length > 1 ? "s" : ""} awaiting approval`,
        severity: "warn",
      });
    }

    if (["WAITING_FEEDBACK", "APPROVAL_PENDING"].includes(p.status)) {
      items.push({
        id: `wait-${p.id}`,
        projectId: p.id,
        projectTitle: p.title,
        type: "waiting_client",
        label: "Waiting on client response",
        severity: "info",
      });
    }
  }

  return items.slice(0, limit);
}

export async function getBusinessStats(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    include: { payments: true, files: { where: { deletedAt: null } } },
  });

  const byStatus: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  let totalRevisions = 0;

  for (const p of projects) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    totalRevisions += p.files.length;
    for (const pay of p.payments) {
      if (pay.status === "PAID" && pay.paidDate) {
        const key = pay.paidDate.toISOString().slice(0, 7);
        byMonth[key] = (byMonth[key] || 0) + Number(pay.amount);
      }
    }
  }

  const completed = projects.filter((p) =>
    ["DELIVERED", "COMPLETED", "ARCHIVED"].includes(p.status)
  );

  return {
    totalProjects: projects.length,
    completedProjects: completed.length,
    byStatus,
    revenueByMonth: byMonth,
    avgFilesPerProject:
      projects.length > 0 ? Math.round(totalRevisions / projects.length) : 0,
  };
}

export async function getProjectStats(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      payments: true,
      feedback: true,
      accessLogs: true,
      files: {
        where: { deletedAt: null },
        include: { accessLogs: true },
      },
    },
  });

  if (!project) return null;

  const views = project.files.reduce(
    (n, f) => n + f.accessLogs.filter((l) => l.eventType === "VIEW").length,
    0
  );
  const downloads = project.files.reduce(
    (n, f) => n + f.accessLogs.filter((l) => l.eventType === "DOWNLOAD").length,
    0
  );

  return {
    portalVisits: project.accessLogs.length,
    fileViews: views,
    fileDownloads: downloads,
    feedbackCount: project.feedback.length,
    openFeedback: project.feedback.filter((f) => f.status === "OPEN").length,
    revisionCount: project.files.length,
    paymentProgress: summarizePaymentProgress(project.payments),
  };
}

export async function getProtectionReport(userId: string) {
  const files = await prisma.file.findMany({
    where: {
      project: { userId },
      deletedAt: null,
      accessLogs: { some: { eventType: "DOWNLOAD" } },
    },
    include: {
      project: { include: { payments: true } },
      accessLogs: { where: { eventType: "DOWNLOAD" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const risky = files.filter((f) => {
    const unpaid = f.project.payments.some(
      (p) => p.lineKind === "MILESTONE" && p.status !== "PAID"
    );
    return unpaid && f.isFinalDeliverable;
  });

  return {
    totalDownloads: files.reduce((n, f) => n + f.accessLogs.length, 0),
    downloadsBeforePayment: risky.length,
    riskyFiles: risky.map((f) => ({
      id: f.id,
      label: f.label,
      projectId: f.projectId,
      projectTitle: f.project.title,
    })),
  };
}
