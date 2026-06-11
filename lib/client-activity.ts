import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  ClientActivityItem,
  ProjectClientActivity,
  ProjectViewSummary,
} from "@/lib/client-activity-utils";

export type { ClientActivityItem, ProjectClientActivity, ProjectViewSummary };

/** Portal + file view counts and a merged activity timeline for one project. */
export async function getProjectClientActivity(
  projectId: string,
  userId: string
): Promise<ProjectClientActivity | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) return null;

  const [
    portalViews,
    fileViews,
    fileDownloads,
    lastPortal,
    lastFile,
    accessLogs,
    fileLogs,
    feedback,
    workMessages,
  ] = await Promise.all([
    prisma.accessLog.count({ where: { projectId } }),
    prisma.fileAccessLog.count({ where: { projectId, eventType: "VIEW" } }),
    prisma.fileAccessLog.count({ where: { projectId, eventType: "DOWNLOAD" } }),
    prisma.accessLog.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.fileAccessLog.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.accessLog.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true },
    }),
    prisma.fileAccessLog.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        createdAt: true,
        eventType: true,
        file: { select: { label: true } },
      },
    }),
    prisma.feedback.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, createdAt: true, type: true, submittedByName: true },
    }),
    prisma.workRequestMessage.findMany({
      where: { workRequest: { projectId }, fromClient: true },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        createdAt: true,
        workRequest: { select: { title: true } },
      },
    }),
  ]);

  const lastSeenAt =
    [lastPortal?.createdAt, lastFile?.createdAt]
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;

  const feedbackLabels: Record<string, string> = {
    CHANGE_REQUEST: "Change request",
    APPROVAL: "Approval",
    QUESTION: "Question",
  };

  const items: ClientActivityItem[] = [
    ...accessLogs.map((a) => ({
      id: `portal-${a.id}`,
      at: a.createdAt,
      kind: "portal_visit" as const,
      label: "Opened client portal",
    })),
    ...fileLogs.map((l) => ({
      id: `file-${l.id}`,
      at: l.createdAt,
      kind: l.eventType === "DOWNLOAD" ? ("file_download" as const) : ("file_view" as const),
      label:
        l.eventType === "DOWNLOAD"
          ? `Downloaded ${l.file.label || "file"}`
          : `Viewed ${l.file.label || "file"}`,
    })),
    ...feedback.map((f) => ({
      id: `feedback-${f.id}`,
      at: f.createdAt,
      kind: "feedback" as const,
      label: `${feedbackLabels[f.type] || f.type} feedback${f.submittedByName ? ` from ${f.submittedByName}` : ""}`,
    })),
    ...workMessages.map((m) => ({
      id: `msg-${m.id}`,
      at: m.createdAt,
      kind: "work_message" as const,
      label: `Message on "${m.workRequest.title}"`,
    })),
  ];

  items.sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    portalViews,
    fileViews,
    fileDownloads,
    lastSeenAt,
    recent: items.slice(0, 25),
  };
}

/** Lightweight counts for project list cards. */
export async function getProjectViewSummaries(
  userId: string,
  projectIds: string[]
): Promise<Map<string, ProjectViewSummary>> {
  if (projectIds.length === 0) return new Map();

  const [portalCounts, fileViewCounts, lastPortalLogs, lastFileLogs] = await Promise.all([
    prisma.accessLog.groupBy({
      by: ["projectId"],
      where: { projectId: { in: projectIds }, project: { userId } },
      _count: { id: true },
    }),
    prisma.fileAccessLog.groupBy({
      by: ["projectId"],
      where: { projectId: { in: projectIds }, eventType: "VIEW" },
      _count: { id: true },
    }),
    prisma.accessLog.findMany({
      where: { projectId: { in: projectIds }, project: { userId } },
      orderBy: { createdAt: "desc" },
      select: { projectId: true, createdAt: true },
    }),
    prisma.fileAccessLog.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: "desc" },
      select: { projectId: true, createdAt: true },
    }),
  ]);

  const portalMap = new Map(portalCounts.map((r) => [r.projectId, r._count.id]));
  const fileMap = new Map(fileViewCounts.map((r) => [r.projectId, r._count.id]));

  const lastMap = new Map<string, Date>();
  for (const log of [...lastPortalLogs, ...lastFileLogs].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )) {
    const prev = lastMap.get(log.projectId);
    if (!prev || log.createdAt > prev) {
      lastMap.set(log.projectId, log.createdAt);
    }
  }

  const out = new Map<string, ProjectViewSummary>();
  for (const id of projectIds) {
    out.set(id, {
      projectId: id,
      portalViews: portalMap.get(id) ?? 0,
      fileViews: fileMap.get(id) ?? 0,
      lastSeenAt: lastMap.get(id) ?? null,
    });
  }
  return out;
}
