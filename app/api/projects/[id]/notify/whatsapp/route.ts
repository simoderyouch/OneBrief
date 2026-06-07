import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildPortalUrl,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
  type WhatsAppTemplate,
  WHATSAPP_TEMPLATE_LABELS,
} from "@/lib/whatsapp";
import { createInAppNotification } from "@/lib/notify";
import { NextRequest } from "next/server";

const VALID_TEMPLATES = new Set<string>(Object.keys(WHATSAPP_TEMPLATE_LABELS));

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
    select: { clientWhatsapp: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json({
    templates: WHATSAPP_TEMPLATE_LABELS,
    hasClientPhone: Boolean(project.clientWhatsapp?.trim()),
  });
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
  const template = (body.template || "portal_link") as WhatsAppTemplate;

  if (!VALID_TEMPLATES.has(template)) {
    return Response.json({ error: "Invalid template" }, { status: 400 });
  }

  const [project, user] = await Promise.all([
    prisma.project.findFirst({
      where: { id, userId: session.user.id },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        nickname: true,
        name: true,
        whatsappDefaultCountryCode: true,
      },
    }),
  ]);

  if (!project || !user) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.clientWhatsapp?.trim()) {
    return Response.json(
      {
        error: "Add client WhatsApp number in Edit project first (e.g. 0612345678 or 212612345678)",
      },
      { status: 400 }
    );
  }

  const phone = normalizeWhatsAppPhone(
    project.clientWhatsapp,
    user.whatsappDefaultCountryCode || "212"
  );

  if (!phone) {
    return Response.json(
      { error: "Invalid WhatsApp number. Use digits only, e.g. 0612345678 or 212612345678" },
      { status: 400 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000";

  const portalUrl = buildPortalUrl(baseUrl, {
    title: project.title,
    clientName: project.clientName,
    token: project.token,
  });
  const studioName = user.nickname?.trim() || user.name?.trim() || "Studio";
  const message = buildWhatsAppMessage({
    template,
    clientName: project.clientName || "there",
    projectTitle: project.title,
    portalUrl,
    studioName,
  });

  const url = buildWhatsAppUrl(phone, message);

  await createInAppNotification({
    projectId: project.id,
    type: "WHATSAPP_NUDGE",
    sentTo: "CLIENT",
    email: project.clientEmail || phone,
    title: `WhatsApp: ${WHATSAPP_TEMPLATE_LABELS[template]}`,
    body: message.slice(0, 500),
    templateKey: `whatsapp_${template}`,
  });

  return Response.json({ url, message, phone });
}
