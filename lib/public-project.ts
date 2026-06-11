import { prisma } from "@/lib/prisma";
import { parsePortalTokenFromParams, parsePortalTokenFromUrlSegment } from "@/lib/client-portal-url";
import { rateLimitPublicByToken } from "@/lib/rate-limit";

export type PublicProjectError =
  | "RATE_LIMIT"
  | "NOT_FOUND"
  | "REVOKED"
  | "EXPIRED"
  | "INACTIVE";

function getIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") || "unknown";
}

type ResolveOptions = {
  /** When true, append a row to AccessLog (use for HTML page / GET client API). Default: true */
  logAccess?: boolean;
};

/**
 * Validates public client token, applies rate limit, optionally logs access (page views).
 */
export async function resolvePublicProject(
  tokenFromUrl: string,
  headers: Headers,
  options: ResolveOptions = {}
): Promise<
  | { ok: true; project: NonNullable<Awaited<ReturnType<typeof fetchProjectByToken>>> }
  | { ok: false; error: PublicProjectError }
> {
  const stored = parsePortalTokenFromUrlSegment(tokenFromUrl);
  return resolvePublicProjectByStoredToken(stored, headers, options);
}

/** Validates `/p/[slug]/[token]` and `/api/client/[slug]/[token]` routes. */
export async function resolvePublicPortal(
  slug: string,
  tokenFromUrl: string,
  headers: Headers,
  options: ResolveOptions = {}
): Promise<
  | { ok: true; project: NonNullable<Awaited<ReturnType<typeof fetchProjectByToken>>> }
  | { ok: false; error: PublicProjectError }
> {
  const stored = parsePortalTokenFromParams(slug, tokenFromUrl);
  return resolvePublicProjectByStoredToken(stored, headers, options);
}

async function resolvePublicProjectByStoredToken(
  stored: string,
  headers: Headers,
  options: ResolveOptions = {}
): Promise<
  | { ok: true; project: NonNullable<Awaited<ReturnType<typeof fetchProjectByToken>>> }
  | { ok: false; error: PublicProjectError }
> {
  const logAccess = options.logAccess !== false;

  const { success } = await rateLimitPublicByToken(stored);
  if (!success) {
    return { ok: false, error: "RATE_LIMIT" };
  }

  const project = await fetchProjectByToken(stored);
  if (!project) {
    return { ok: false, error: "NOT_FOUND" };
  }

  if (!project.tokenActive) {
    return { ok: false, error: "INACTIVE" };
  }
  if (project.tokenRevokedAt) {
    return { ok: false, error: "REVOKED" };
  }
  if (project.tokenExpiresAt && project.tokenExpiresAt < new Date()) {
    return { ok: false, error: "EXPIRED" };
  }

  const ip = getIp(headers);
  const userAgent = headers.get("user-agent") || undefined;

  /** Count one portal view per IP per project per 30 minutes (avoids refresh spam). */
  if (logAccess) {
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const recent = await prisma.accessLog.findFirst({
      where: {
        projectId: project.id,
        ipAddress: ip,
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (!recent) {
      await prisma.accessLog.create({
        data: {
          projectId: project.id,
          ipAddress: ip,
          userAgent,
        },
      });
    }
  }

  return { ok: true, project };
}

async function fetchProjectByToken(storedToken: string) {
  return prisma.project.findFirst({
    where: { token: storedToken },
    include: {
      files: {
        where: { deletedAt: null },
        orderBy: [{ label: "asc" }, { versionNumber: "desc" }],
      },
      feedback: {
        include: {
          file: true,
          projectClient: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: { orderBy: { createdAt: "asc" } },
      workRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          projectClient: { select: { id: true, fullName: true, email: true } },
        },
      },
      user: {
        select: {
          name: true,
          nickname: true,
          avatarUrl: true,
          email: true,
          accentColor: true,
        },
      },
    },
  });
}
