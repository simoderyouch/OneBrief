import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; packageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, packageId } = await params;
  const body = await request.json();

  const pkg = await prisma.deliverablePackage.findFirst({
    where: { id: packageId, projectId: id, project: { userId: session.user.id } },
  });
  if (!pkg) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.deliverablePackage.update({
    where: { id: packageId },
    data: {
      name: body.name,
      description: body.description,
      sortOrder: body.sortOrder,
      paymentId: body.paymentId,
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; packageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, packageId } = await params;

  const pkg = await prisma.deliverablePackage.findFirst({
    where: { id: packageId, projectId: id, project: { userId: session.user.id } },
  });
  if (!pkg) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.file.updateMany({
    where: { packageId },
    data: { packageId: null },
  });
  await prisma.deliverablePackage.delete({ where: { id: packageId } });

  return Response.json({ ok: true });
}
