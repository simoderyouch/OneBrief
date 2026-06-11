import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

async function getOwnedLink(userId: string, projectId: string, linkId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) return null;
  return prisma.deliveryLink.findFirst({ where: { id: linkId, projectId } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, linkId } = await params;
  const link = await getOwnedLink(session.user.id, id, linkId);
  if (!link) return Response.json({ error: "Not found" }, { status: 404 });

  const { label, url } = await req.json();
  const updated = await prisma.deliveryLink.update({
    where: { id: linkId },
    data: {
      ...(label !== undefined && { label: label.trim() || "Download files" }),
      ...(url !== undefined && { url: url.trim() }),
    },
  });
  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, linkId } = await params;
  const link = await getOwnedLink(session.user.id, id, linkId);
  if (!link) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.deliveryLink.delete({ where: { id: linkId } });
  return Response.json({ success: true });
}
