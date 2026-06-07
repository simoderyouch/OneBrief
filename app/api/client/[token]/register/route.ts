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
  let body: { fullName?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (fullName.length < 2) {
    return Response.json({ error: "Full name must be at least 2 characters" }, { status: 400 });
  }
  if (!EMAIL_RE.test(emailRaw)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (password.length > 128) {
    return Response.json({ error: "Password is too long" }, { status: 400 });
  }

  const existing = await prisma.projectClient.findUnique({
    where: {
      projectId_email: { projectId: project.id, email: emailRaw },
    },
  });
  if (existing) {
    return Response.json(
      { error: "An account with this email already exists for this project. Sign in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const client = await prisma.projectClient.create({
    data: {
      projectId: project.id,
      email: emailRaw,
      fullName,
      passwordHash,
    },
    select: { id: true, fullName: true, email: true },
  });

  await setClientPortalCookie(project.id, client.id);

  return Response.json(
    { ok: true, client: { fullName: client.fullName, email: client.email } },
    { status: 201 }
  );
}
