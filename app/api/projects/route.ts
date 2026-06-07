import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/token";
import { buildClientPortalUrl } from "@/lib/client-portal-url";
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
  const { title, description, serviceType, clientName, clientEmail, clientWhatsapp, deadline, totalPrice, currency, templateId } = body;

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const owner = await prisma.user.findUnique({ where: { id: user.id } });
  let template = null;
  if (templateId) {
    template = await prisma.projectTemplate.findFirst({
      where: { id: templateId, userId: user.id },
    });
  }

  const rawToken = generateToken();
  const hashedToken = hashToken(rawToken);
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + CLIENT_TOKEN_TTL_DAYS);

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title,
      description: description ?? template?.description,
      serviceType: serviceType ?? template?.serviceType,
      clientName,
      clientEmail,
      clientWhatsapp: clientWhatsapp || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
      currency: currency || owner?.defaultCurrency || "MAD",
      token: hashedToken,
      tokenExpiresAt,
      tokenRevokedAt: null,
      securityTier: template?.defaultSecurityTier ?? owner?.defaultSecurityTier ?? "PROTECTED",
      revisionLimit: template?.defaultRevisionLimit ?? owner?.defaultRevisionLimit ?? 3,
      scopeDocument: template?.scopeDocument,
      briefContent: template?.briefContent,
      paymentGateEnabled: true,
      paymentGateMode: "DEPOSIT_PAID",
      autoUnlockOnPayment: true,
      startedAt: new Date(),
    },
  });

  return Response.json(
    {
      ...project,
      clientUrl: buildClientPortalUrl(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
        title: project.title,
        clientName: project.clientName,
        token: hashedToken,
      }),
    },
    { status: 201 }
  );
}
