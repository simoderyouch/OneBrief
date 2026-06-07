import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.projectTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(templates);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const template = await prisma.projectTemplate.create({
    data: {
      userId: session.user.id,
      name: body.name,
      description: body.description,
      serviceType: body.serviceType,
      defaultRevisionLimit: body.defaultRevisionLimit,
      defaultSecurityTier: body.defaultSecurityTier,
      scopeDocument: body.scopeDocument,
      briefContent: body.briefContent,
    },
  });

  return Response.json(template, { status: 201 });
}
