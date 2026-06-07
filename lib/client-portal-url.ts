import { tokenToStoredValue } from "@/lib/token";

const STORED_TOKEN_HEX_LEN = 64;

export type ClientPortalLinkProject = {
  title: string;
  clientName?: string | null;
  /** SHA-256 hex stored in `project.token` */
  token: string;
};

/** URL-safe slug from project title (+ optional client name). */
export function buildProjectSlug(
  projectTitle: string,
  clientName?: string | null
): string {
  const base = clientName?.trim()
    ? `${clientName.trim()}-${projectTitle.trim()}`
    : projectTitle.trim();
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 48);
}

/** Relative path under `/p/` — `{slug}/{64-char hash}`. */
export function buildClientPortalPath(project: ClientPortalLinkProject): string {
  const slug = buildProjectSlug(project.title, project.clientName);
  const hash = project.token.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw new Error("Project token must be a 64-char SHA-256 hex hash");
  }
  return `${slug}/${hash}`;
}

export function buildClientPortalUrl(
  baseUrl: string,
  project: ClientPortalLinkProject
): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/p/${buildClientPortalPath(project)}`;
}

export function clientPortalApiBase(portalSlug: string, portalToken: string): string {
  return `/api/client/${portalSlug}/${portalToken}`;
}

export function buildClientPortalPreviewPath(
  portalSlug: string,
  portalToken: string,
  fileId: string
): string {
  return `/p/${portalSlug}/${portalToken}/preview/${fileId}`;
}

/** DB lookup value from `/p/[slug]/[token]` route params. */
export function parsePortalTokenFromParams(
  _slug: string,
  token: string
): string {
  const lower = token.trim().toLowerCase();
  if (new RegExp(`^[a-f0-9]{${STORED_TOKEN_HEX_LEN}}$`).test(lower)) {
    return lower;
  }
  return tokenToStoredValue(token);
}

/**
 * Legacy single-segment parser: `{slug}/{hash}`, `{slug}--{hash}`, bare hash, raw tokens.
 */
export function parsePortalTokenFromUrlSegment(segment: string): string {
  const decoded = decodeURIComponent(segment.trim());
  const lower = decoded.toLowerCase();

  const slashParts = lower.split("/");
  if (slashParts.length >= 2) {
    const last = slashParts[slashParts.length - 1];
    if (new RegExp(`^[a-f0-9]{${STORED_TOKEN_HEX_LEN}}$`).test(last)) {
      return last;
    }
  }

  const legacyDoubleDash = lower.match(
    new RegExp(`^[a-z0-9-]+--([a-f0-9]{${STORED_TOKEN_HEX_LEN}})$`)
  );
  if (legacyDoubleDash) {
    return legacyDoubleDash[1];
  }

  if (new RegExp(`^[a-f0-9]{${STORED_TOKEN_HEX_LEN}}$`).test(lower)) {
    return lower;
  }

  return tokenToStoredValue(decoded);
}
