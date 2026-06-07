import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resolvePublicProject } from "@/lib/public-project";
import { setClientPortalCookie } from "@/lib/project-client-auth";
import { NextRequest } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await resolvePublicProject(token, request.headers, { logAccess: false });

  if (!result.ok) {
    const status =
      result.error === "NOT_FOUND" ? 404 : result.error === "RATE_LIMIT" ? 429 : 403;
    return Response.json({ error: "Access denied" }, { status });
  }

  const { project } = result;
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL_RE.test(emailRaw)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!password) {
    return Response.json({ error: "Password is required" }, { status: 400 });
  }

  const client = await prisma.projectClient.findUnique({
    where: {
      projectId_email: { projectId: project.id, email: emailRaw },
    },
  });

  if (!client) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, client.passwordHash);
  if (!ok) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await setClientPortalCookie(project.id, client.id);

  return Response.json({
    ok: true,
    client: { fullName: client.fullName, email: client.email },
  });
}
