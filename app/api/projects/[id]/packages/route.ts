import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    select: { id: true },
  });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const packages = await prisma.deliverablePackage.findMany({
    where: { projectId: id },
    include: { files: { where: { deletedAt: null }, orderBy: { uploadedAt: "desc" } } },
    orderBy: { sortOrder: "asc" },
  });

  return Response.json(packages);
}

export async function POST(
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
    select: { id: true },
  });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const count = await prisma.deliverablePackage.count({ where: { projectId: id } });

  const pkg = await prisma.deliverablePackage.create({
    data: {
      projectId: id,
      name: body.name || "New package",
      description: body.description,
      sortOrder: body.sortOrder ?? count,
      paymentId: body.paymentId,
    },
  });

  return Response.json(pkg, { status: 201 });
}
