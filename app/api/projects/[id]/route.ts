import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectStatusChangedEmail } from "@/lib/email";
import { sendClientEmailWithLog } from "@/lib/notify";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      files: { orderBy: { uploadedAt: "desc" } },
      feedback: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json(project);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const prevStatus = project.status;
  let tokenRevokedAt: Date | null | undefined = undefined;
  if (body.tokenActive === false) {
    tokenRevokedAt = new Date();
  } else if (body.tokenActive === true) {
    tokenRevokedAt = null;
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      serviceType: body.serviceType,
      status: body.status,
      stage: body.stage,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      totalPrice: body.totalPrice != null ? parseFloat(body.totalPrice) : undefined,
      currency: body.currency,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      tokenActive: body.tokenActive,
      tokenRevokedAt,
      securityTier: body.securityTier,
      internalNote: body.internalNote,
    },
  });

  const owner = await prisma.user.findUnique({
    where: { id: project.userId },
    select: { notifyStatus: true },
  });

  if (
    body.status != null &&
    body.status !== prevStatus &&
    updated.clientEmail &&
    owner?.notifyStatus &&
    process.env.RESEND_API_KEY &&
    process.env.RESEND_API_KEY.length > 0
  ) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const isTokenUsable =
      updated.tokenActive &&
      !updated.tokenRevokedAt &&
      (!updated.tokenExpiresAt || updated.tokenExpiresAt > new Date());
    const projectUrl = isTokenUsable ? `${baseUrl}/p/${updated.token}` : undefined;

    const html = projectStatusChangedEmail(
      updated.clientName || "there",
      updated.title,
      String(body.status).replace(/_/g, " "),
      projectUrl
    );
    await sendClientEmailWithLog({
      projectId: id,
      type: "STATUS_CHANGED",
      toEmail: updated.clientEmail,
      subject: `Project update: ${updated.title}`,
      html,
      templateKey: "status_changed",
    });
  }

  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return Response.json({ success: true });
}
