import { auth } from "@/lib/auth";
import { streamFileResponse, type FileAccessIntent } from "@/lib/file-access";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const intent = (request.nextUrl.searchParams.get("intent") || "view") as FileAccessIntent;

  if (intent !== "view" && intent !== "download") {
    return Response.json({ error: "Invalid intent" }, { status: 400 });
  }

  const file = await prisma.file.findFirst({
    where: { id, deletedAt: null },
    include: {
      project: {
        select: { id: true, securityTier: true, clientName: true, userId: true },
      },
    },
  });

  if (!file || file.project.userId !== session.user.id) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  return streamFileResponse({
    file,
    tier: file.project.securityTier,
    intent,
    headers: request.headers,
    skipLog: true,
  });
}
