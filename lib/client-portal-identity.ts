import type { NextRequest } from "next/server";

const SESSION_HEADER = "x-client-session";

export function sessionIdFromRequest(
  request: NextRequest,
  body?: Record<string, unknown>
): string | undefined {
  const fromHeader = request.headers.get(SESSION_HEADER)?.trim();
  if (fromHeader && fromHeader.length > 0 && fromHeader.length <= 64) {
    return fromHeader;
  }
  const fromBody =
    typeof body?.sessionId === "string" ? body.sessionId.trim() : undefined;
  if (fromBody && fromBody.length > 0 && fromBody.length <= 64) {
    return fromBody;
  }
  return undefined;
}

export function displayNameFromBody(
  body?: Record<string, unknown>
): string | undefined {
  const name =
    typeof body?.displayName === "string" ? body.displayName.trim() : undefined;
  if (name && name.length > 0 && name.length <= 80) return name;
  return undefined;
}

/** Fallback label when the client did not provide a display name. */
export function defaultClientDisplayName(project: {
  clientName?: string | null;
}): string | undefined {
  const name = project.clientName?.trim();
  return name && name.length > 0 ? name : undefined;
}
