import { prisma } from "@/lib/prisma";
import { resolvePublicPortal } from "@/lib/public-project";
import {
  defaultClientDisplayName,
  displayNameFromBody,
  sessionIdFromRequest,
} from "@/lib/client-portal-identity";
import { feedbackReceivedEmail } from "@/lib/email";
import { sendFreelancerEmailWithLog } from "@/lib/notify";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  const { slug, token } = await params;
  const result = await resolvePublicPortal(slug, token, request.headers, { logAccess: false });

  if (!result.ok) {
    const status =
      result.error === "NOT_FOUND"
        ? 404
        : result.error === "RATE_LIMIT"
          ? 429
          : 403;
    return Response.json({ error: "Access denied" }, { status });
  }

  const { project } = result;
  const body = await request.json();
  const { type, message, fileId } = body;

  if (!type || !message) {
    return Response.json({ error: "Type and message are required" }, { status: 400 });
  }

  const submittedByName =
    displayNameFromBody(body) ?? defaultClientDisplayName(project);
  const submittedBySessionId = sessionIdFromRequest(request, body);

  const feedback = await prisma.feedback.create({
    data: {
      projectId: project.id,
      fileId: fileId || undefined,
      type,
      message,
      submittedByName,
      submittedBySessionId,
    },
  });

  const freelancer = await prisma.user.findUnique({
    where: { id: project.userId },
    select: { email: true, name: true, nickname: true, notifyFeedback: true },
  });

  if (freelancer?.email && freelancer.notifyFeedback) {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const projectUrl = `${base}/dashboard/${project.id}`;
    const tpl = feedbackReceivedEmail(
      freelancer.nickname?.trim() || freelancer.name?.trim() || "there",
      project.title,
      type,
      message,
      projectUrl,
      feedback.submittedByName
    );

    if (type === "APPROVAL" && fileId) {
      await prisma.file.update({
        where: { id: fileId },
        data: { approvalStatus: "APPROVED" },
      });
    } else if (type === "CHANGE_REQUEST" && fileId) {
      await prisma.file.update({
        where: { id: fileId },
        data: { approvalStatus: "CHANGES_REQUESTED" },
      });
    }

    await sendFreelancerEmailWithLog({
      projectId: project.id,
      type: type === "APPROVAL" ? "APPROVAL_RECEIVED" : "FEEDBACK_RECEIVED",
      toEmail: freelancer.email,
      subject: tpl.subject,
      html: tpl.html,
      body: tpl.textBody,
      templateKey: type === "APPROVAL" ? "approval_received" : "feedback_received",
    });
  }

  return Response.json(feedback, { status: 201 });
}
