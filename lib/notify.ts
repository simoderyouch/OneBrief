import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";
import { sendEmail } from "@/lib/email";

export async function sendFreelancerEmailWithLog(params: {
  projectId: string;
  type: NotificationType;
  toEmail: string;
  subject: string;
  html: string;
  templateKey: string;
}): Promise<{ ok: boolean }> {
  const row = await prisma.notification.create({
    data: {
      projectId: params.projectId,
      type: params.type,
      sentTo: "FREELANCER",
      email: params.toEmail,
      templateKey: params.templateKey,
      deliveryStatus: "PENDING",
    },
  });

  try {
    await sendEmail({ to: params.toEmail, subject: params.subject, html: params.html });
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

export async function sendClientEmailWithLog(params: {
  projectId: string;
  type: NotificationType;
  toEmail: string;
  subject: string;
  html: string;
  templateKey: string;
}): Promise<{ ok: boolean }> {
  const row = await prisma.notification.create({
    data: {
      projectId: params.projectId,
      type: params.type,
      sentTo: "CLIENT",
      email: params.toEmail,
      templateKey: params.templateKey,
      deliveryStatus: "PENDING",
    },
  });

  try {
    await sendEmail({ to: params.toEmail, subject: params.subject, html: params.html });
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
