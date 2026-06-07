import { auth } from "@/lib/auth";
import { FILE_SHARE_LINK_TTL_DAYS } from "@/lib/constants";
import { generateToken, hashToken } from "@/lib/token";
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
    include: { project: { select: { userId: true } } },
  });

  if (!file || file.project.userId !== session.user.id) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  const links = await prisma.fileShareLink.findMany({
    where: { fileId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tokenActive: true,
      downloadAllowed: true,
      maxViews: true,
      viewCount: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });

  return Response.json(links);
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
  const body = await request.json().catch(() => ({}));

  const file = await prisma.file.findFirst({
    where: { id, deletedAt: null },
    include: { project: { select: { userId: true } } },
  });

  if (!file || file.project.userId !== session.user.id) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  const rawToken = generateToken();
  const storedToken = hashToken(rawToken);

  const ttlDays =
    typeof body.ttlDays === "number" && body.ttlDays > 0
      ? Math.min(body.ttlDays, 365)
      : FILE_SHARE_LINK_TTL_DAYS;

  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  const maxViews =
    typeof body.maxViews === "number" && body.maxViews > 0
      ? Math.min(body.maxViews, 10_000)
      : body.maxViews === null
        ? null
        : undefined;

  const link = await prisma.fileShareLink.create({
    data: {
      fileId: id,
      token: storedToken,
      downloadAllowed: Boolean(body.downloadAllowed),
      maxViews: maxViews ?? null,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return Response.json(
    {
      id: link.id,
      url: `${baseUrl}/s/${rawToken}`,
      expiresAt: link.expiresAt,
      maxViews: link.maxViews,
      downloadAllowed: link.downloadAllowed,
    },
    { status: 201 }
  );
}
