import { prisma } from "@/lib/prisma";
import { resolvePublicProject } from "@/lib/public-project";
import { getProjectClientFromRequest } from "@/lib/project-client-auth";
import { feedbackReceivedEmail } from "@/lib/email";
import { sendFreelancerEmailWithLog } from "@/lib/notify";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await resolvePublicProject(token, request.headers, { logAccess: false });

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
  const client = await getProjectClientFromRequest(request, project.id);
  if (!client) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json();
  const { type, message, fileId } = body;

  if (!type || !message) {
    return Response.json({ error: "Type and message are required" }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      projectId: project.id,
      fileId: fileId || undefined,
      type,
      message,
      projectClientId: client.id,
      submittedByName: client.fullName,
      submittedBySessionId: null,
    },
  });

  const freelancer = await prisma.user.findUnique({
    where: { id: project.userId },
    select: { email: true, name: true, nickname: true, notifyFeedback: true },
  });

  if (
    freelancer?.email &&
    freelancer.notifyFeedback &&
    process.env.RESEND_API_KEY &&
    process.env.RESEND_API_KEY.length > 0
  ) {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const projectUrl = `${base}/dashboard/${project.id}`;
    const html = feedbackReceivedEmail(
      freelancer.nickname?.trim() || freelancer.name?.trim() || "there",
      project.title,
      type,
      message,
      projectUrl,
      feedback.submittedByName
    );
    await sendFreelancerEmailWithLog({
      projectId: project.id,
      type: "FEEDBACK_RECEIVED",
      toEmail: freelancer.email,
      subject: `New feedback: ${project.title}`,
      html,
      templateKey: "feedback_received",
    });
  }

  return Response.json(feedback, { status: 201 });
}
