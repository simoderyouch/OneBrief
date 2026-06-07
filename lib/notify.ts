import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";
import { sendLocalNotification } from "@/lib/email";

type NotifyParams = {
  projectId: string;
  type: NotificationType;
  toEmail: string;
  subject: string;
  html: string;
  templateKey: string;
  title?: string;
  body?: string;
  sentTo: "FREELANCER" | "CLIENT";
};

async function deliverNotification(params: NotifyParams): Promise<{ ok: boolean }> {
  const row = await prisma.notification.create({
    data: {
      projectId: params.projectId,
      type: params.type,
      sentTo: params.sentTo,
      email: params.toEmail,
      templateKey: params.templateKey,
      title: params.title ?? params.subject,
      body: params.body ?? params.html.replace(/<[^>]+>/g, " ").slice(0, 2000),
      deliveryStatus: "PENDING",
    },
  });

  try {
    await sendLocalNotification({
      to: params.toEmail,
      subject: params.subject,
      html: params.html,
    });
    await prisma.notification.update({
      where: { id: row.id },
      data: { deliveryStatus: "SENT" },
    });
    return { ok: true };
  } catch {
    await prisma.notification.update({
      where: { id: row.id },
      data: { deliveryStatus: "FAILED" },
    });
    return { ok: false };
  }
}

export async function sendFreelancerEmailWithLog(params: {
  projectId: string;
  type: NotificationType;
  toEmail: string;
  subject: string;
  html: string;
  templateKey: string;
  title?: string;
  body?: string;
}): Promise<{ ok: boolean }> {
  return deliverNotification({ ...params, sentTo: "FREELANCER" });
}

export async function sendClientEmailWithLog(params: {
  projectId: string;
  type: NotificationType;
  toEmail: string;
  subject: string;
  html: string;
  templateKey: string;
  title?: string;
  body?: string;
}): Promise<{ ok: boolean }> {
  return deliverNotification({ ...params, sentTo: "CLIENT" });
}

export async function createInAppNotification(params: {
  projectId: string;
  type: NotificationType;
  sentTo: "FREELANCER" | "CLIENT";
  email: string;
  title: string;
  body: string;
  templateKey?: string;
}) {
  return prisma.notification.create({
    data: {
      projectId: params.projectId,
      type: params.type,
      sentTo: params.sentTo,
      email: params.email,
      title: params.title,
      body: params.body,
      templateKey: params.templateKey,
      deliveryStatus: "SENT",
    },
  });
}
