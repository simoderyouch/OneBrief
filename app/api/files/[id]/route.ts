import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { NextRequest } from "next/server";

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

  const file = await prisma.file.findFirst({
    where: { id },
    include: { project: true },
  });

  if (!file || file.project.userId !== session.user.id) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  const updated = await prisma.file.update({
    where: { id },
    data: {
      label: body.label,
      note: body.note,
      clientVisible: body.clientVisible,
      downloadAllowed: body.downloadAllowed,
      packageId: body.packageId,
      approvalStatus: body.approvalStatus,
      isFinalDeliverable: body.isFinalDeliverable,
      status: body.status,
    },
  });

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

  const file = await prisma.file.findFirst({
    where: { id },
    include: { project: true },
  });

  if (!file || file.project.userId !== session.user.id) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  await deleteFile(file.publicId);
  await prisma.file.update({ where: { id }, data: { deletedAt: new Date() } });

  return Response.json({ success: true });
}
