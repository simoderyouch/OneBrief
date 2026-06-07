import { prisma } from "@/lib/prisma";
import { rateLimitPublicByToken } from "@/lib/rate-limit";
import { tokenToStoredValue } from "@/lib/token";

export type FileShareLinkError =
  | "RATE_LIMIT"
  | "NOT_FOUND"
  | "REVOKED"
  | "EXPIRED"
  | "INACTIVE"
  | "MAX_VIEWS";

function getIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || "unknown";
}

/**
 * Validates a per-file share token (`/s/[token]`).
 */
export async function resolveFileShareLink(
  tokenFromUrl: string,
  headers: Headers,
  options: { incrementView?: boolean } = {}
): Promise<
  | {
      ok: true;
      link: NonNullable<Awaited<ReturnType<typeof fetchShareLinkByToken>>>;
    }
  | { ok: false; error: FileShareLinkError }
> {
  const stored = tokenToStoredValue(tokenFromUrl);

  const { success } = await rateLimitPublicByToken(`share:${stored}`);
  if (!success) return { ok: false, error: "RATE_LIMIT" };

  const link = await fetchShareLinkByToken(stored);
  if (!link) return { ok: false, error: "NOT_FOUND" };

  if (!link.tokenActive || link.revokedAt) {
    return { ok: false, error: "REVOKED" };
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return { ok: false, error: "EXPIRED" };
  }
  if (link.maxViews != null && link.viewCount >= link.maxViews) {
    return { ok: false, error: "MAX_VIEWS" };
  }

  if (options.incrementView) {
    await prisma.fileShareLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 } },
    });
    link.viewCount += 1;
  }

  return { ok: true, link };
}

async function fetchShareLinkByToken(storedToken: string) {
  return prisma.fileShareLink.findFirst({
    where: { token: storedToken },
    include: {
      file: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
              clientName: true,
              securityTier: true,
              tokenActive: true,
              tokenRevokedAt: true,
              tokenExpiresAt: true,
              paymentGateEnabled: true,
              paymentGateMode: true,
              paymentGateMilestoneId: true,
              payments: { select: { id: true, status: true, lineKind: true } },
              user: { select: { name: true, nickname: true } },
            },
          },
        },
      },
    },
  });
}

export async function logFileAccess(params: {
  fileId: string;
  projectId: string;
  eventType: "VIEW" | "DOWNLOAD";
  headers: Headers;
  shareLinkId?: string;
}) {
  const ip = getIp(params.headers);
  const userAgent = params.headers.get("user-agent") || undefined;

  await prisma.fileAccessLog.create({
    data: {
      fileId: params.fileId,
      projectId: params.projectId,
      eventType: params.eventType,
      shareLinkId: params.shareLinkId,
      ipAddress: ip,
      userAgent,
    },
  });
}

export type FileAccessStats = {
  views: number;
  downloads: number;
  lastAccessedAt: Date | null;
};

export async function getFileAccessStats(fileId: string): Promise<FileAccessStats> {
  const [views, downloads, last] = await Promise.all([
    prisma.fileAccessLog.count({ where: { fileId, eventType: "VIEW" } }),
    prisma.fileAccessLog.count({ where: { fileId, eventType: "DOWNLOAD" } }),
    prisma.fileAccessLog.findFirst({
      where: { fileId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  return {
    views,
    downloads,
    lastAccessedAt: last?.createdAt ?? null,
  };
}
