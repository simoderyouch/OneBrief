import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const feedback = await prisma.feedback.findFirst({
    where: { id },
    include: { project: true },
  });

  if (!feedback || feedback.project.userId !== session.user.id) {
    return Response.json({ error: "Feedback not found" }, { status: 404 });
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: {
      status: body.status,
      resolvedAt: body.status === "RESOLVED" ? new Date() : undefined,
    },
  });

  return Response.json(updated);
}
