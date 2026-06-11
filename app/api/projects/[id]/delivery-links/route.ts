import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const links = await prisma.deliveryLink.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(links);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const { label, url } = await req.json();
  if (!url || typeof url !== "string") return Response.json({ error: "URL required" }, { status: 400 });

  const link = await prisma.deliveryLink.create({
    data: {
      projectId: id,
      label: (label?.trim()) || "Download files",
      url: url.trim(),
    },
  });
  return Response.json(link, { status: 201 });
}
