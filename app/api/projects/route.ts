import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/token";
import { CLIENT_TOKEN_TTL_DAYS } from "@/lib/constants";
import { NextRequest } from "next/server";

export async function GET() {
  const authResult = await getAuthenticatedUser();
  if (!authResult.ok) {
    if (authResult.reason === "database_unavailable") {
      return Response.json({ error: authResult.message }, { status: 503 });
    }
    return Response.json(
      { error: "Unauthorized — sign out and sign in again if you changed databases." },
      { status: 401 }
    );
  }
  const { user } = authResult;

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      files: { where: { status: "CURRENT" } },
      feedback: { where: { status: "OPEN" } },
      payments: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json(projects);
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthenticatedUser();
  if (!authResult.ok) {
    if (authResult.reason === "database_unavailable") {
      return Response.json({ error: authResult.message }, { status: 503 });
    }
    return Response.json(
      {
        error:
          "Session is not linked to an account in this database. Sign out, then sign in again.",
      },
      { status: 401 }
    );
  }
  const { user } = authResult;

  const body = await request.json();
  const { title, description, serviceType, clientName, clientEmail, deadline, totalPrice, currency } = body;

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const rawToken = generateToken();
  const hashedToken = hashToken(rawToken);
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + CLIENT_TOKEN_TTL_DAYS);

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title,
      description,
      serviceType,
      clientName,
      clientEmail,
      deadline: deadline ? new Date(deadline) : undefined,
      totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
      currency: currency || "MAD",
      token: hashedToken,
      tokenExpiresAt,
      tokenRevokedAt: null,
    },
  });

  return Response.json({ ...project, clientUrl: `${process.env.NEXT_PUBLIC_APP_URL}/p/${rawToken}` }, { status: 201 });
}
