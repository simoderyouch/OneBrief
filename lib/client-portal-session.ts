import { createHmac, timingSafeEqual } from "node:crypto";

/** HttpOnly cookie for `/p/[token]` portal sessions (per project in payload). */
export const CLIENT_PORTAL_COOKIE = "ob_pc";

/** 60 days */
export const CLIENT_PORTAL_MAX_AGE_SEC = 60 * 24 * 60 * 60;

export type ClientPortalPayload = {
  projectId: string;
  projectClientId: string;
  exp: number;
};

function secret(): string {
  const s = process.env.CLIENT_PORTAL_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s || s.length < 8) {
    throw new Error("Set CLIENT_PORTAL_SECRET or NEXTAUTH_SECRET (min 8 chars) for client portal sessions.");
  }
  return s;
}

export function signClientPortalSession(
  payload: Pick<ClientPortalPayload, "projectId" | "projectClientId">
): string {
  const exp = Date.now() + CLIENT_PORTAL_MAX_AGE_SEC * 1000;
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp } satisfies ClientPortalPayload),
    "utf8"
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyClientPortalSession(token: string): ClientPortalPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = createHmac("sha256", secret()).update(body).digest("base64url");
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ClientPortalPayload;
    if (payload.exp < Date.now()) return null;
    if (!payload.projectId || !payload.projectClientId) return null;
    return payload;
  } catch {
    return null;
  }
}
