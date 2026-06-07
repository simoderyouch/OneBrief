import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/token";
import { buildClientPortalUrl } from "@/lib/client-portal-url";
import { CLIENT_TOKEN_TTL_DAYS } from "@/lib/constants";
import { NextRequest } from "next/server";

export async function POST(
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
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const rawToken = generateToken();
  const hashedToken = hashToken(rawToken);
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + CLIENT_TOKEN_TTL_DAYS);

  await prisma.project.update({
    where: { id },
    data: {
      token: hashedToken,
      tokenExpiresAt,
      tokenRevokedAt: null,
      tokenActive: true,
    },
  });

  return Response.json({
    clientUrl: buildClientPortalUrl(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      {
        title: project.title,
        clientName: project.clientName,
        token: hashedToken,
      }
    ),
  });
}
