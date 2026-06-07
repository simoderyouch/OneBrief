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

  const feedback = await prisma.feedback.findMany({
    where: { projectId: id },
    include: { file: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(feedback);
}
