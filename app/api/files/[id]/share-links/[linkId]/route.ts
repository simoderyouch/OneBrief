import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, linkId } = await params;
  const body = await request.json().catch(() => ({}));

  const file = await prisma.file.findFirst({
    where: { id, deletedAt: null },
    include: { project: { select: { userId: true } } },
  });

  if (!file || file.project.userId !== session.user.id) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  const existing = await prisma.fileShareLink.findFirst({
    where: { id: linkId, fileId: id },
  });

  if (!existing) {
    return Response.json({ error: "Share link not found" }, { status: 404 });
  }

  const tokenActive = body.tokenActive;
  const revokedAt =
    tokenActive === false ? new Date() : tokenActive === true ? null : undefined;

  const updated = await prisma.fileShareLink.update({
    where: { id: linkId },
    data: {
      tokenActive: typeof tokenActive === "boolean" ? tokenActive : undefined,
      revokedAt,
      downloadAllowed:
        typeof body.downloadAllowed === "boolean" ? body.downloadAllowed : undefined,
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, linkId } = await params;

  const file = await prisma.file.findFirst({
    where: { id, deletedAt: null },
    include: { project: { select: { userId: true } } },
  });

  if (!file || file.project.userId !== session.user.id) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  await prisma.fileShareLink.deleteMany({
    where: { id: linkId, fileId: id },
  });

  return Response.json({ success: true });
}
