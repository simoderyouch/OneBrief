import { auth } from "@/lib/auth";
import { getFileAccessStats } from "@/lib/file-share";
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

  const file = await prisma.file.findFirst({
    where: { id, deletedAt: null },
    include: { project: { select: { userId: true, securityTier: true } } },
  });

  if (!file || file.project.userId !== session.user.id) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  if (file.project.securityTier === "BASIC") {
    return Response.json({
      tier: "BASIC",
      message: "Upgrade to Standard or Protected tier for view/download analytics.",
      views: 0,
      downloads: 0,
      lastAccessedAt: null,
    });
  }

  const stats = await getFileAccessStats(id);
  return Response.json({ tier: file.project.securityTier, ...stats });
}
