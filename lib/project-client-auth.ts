import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  CLIENT_PORTAL_COOKIE,
  CLIENT_PORTAL_MAX_AGE_SEC,
  signClientPortalSession,
  verifyClientPortalSession,
} from "@/lib/client-portal-session";
import type { ProjectClient } from "@prisma/client";

async function loadProjectClient(
  projectId: string,
  projectClientId: string
): Promise<ProjectClient | null> {
  const pc = await prisma.projectClient.findUnique({
    where: { id: projectClientId },
  });
  if (!pc || pc.projectId !== projectId) return null;
  return pc;
}

/** Server Components / `cookies()` */
export async function getProjectClientFromCookies(projectId: string): Promise<ProjectClient | null> {
  const store = await cookies();
  const raw = store.get(CLIENT_PORTAL_COOKIE)?.value;
  if (!raw) return null;
  const payload = verifyClientPortalSession(raw);
  if (!payload || payload.projectId !== projectId) return null;
  return loadProjectClient(projectId, payload.projectClientId);
}

/** Route handlers (`NextRequest`) */
export async function getProjectClientFromRequest(
  request: NextRequest,
  projectId: string
): Promise<ProjectClient | null> {
  const raw = request.cookies.get(CLIENT_PORTAL_COOKIE)?.value;
  if (!raw) return null;
  const payload = verifyClientPortalSession(raw);
  if (!payload || payload.projectId !== projectId) return null;
  return loadProjectClient(projectId, payload.projectClientId);
}

export async function setClientPortalCookie(projectId: string, projectClientId: string) {
  const store = await cookies();
  const token = signClientPortalSession({ projectId, projectClientId });
  store.set(CLIENT_PORTAL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CLIENT_PORTAL_MAX_AGE_SEC,
  });
}

export async function clearClientPortalCookie() {
  const store = await cookies();
  store.set(CLIENT_PORTAL_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
