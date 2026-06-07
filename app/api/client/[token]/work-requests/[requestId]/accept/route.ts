import { prisma } from "@/lib/prisma";
import { resolvePublicProject } from "@/lib/public-project";
import { getProjectClientFromRequest } from "@/lib/project-client-auth";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; requestId: string }> }
) {
  const { token, requestId } = await params;
  const result = await resolvePublicProject(token, request.headers, { logAccess: false });

  if (!result.ok) {
    const status =
      result.error === "NOT_FOUND" ? 404 : result.error === "RATE_LIMIT" ? 429 : 403;
    return Response.json({ error: "Access denied" }, { status });
  }

  const { project } = result;
  const client = await getProjectClientFromRequest(request, project.id);
  if (!client) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const wr = await prisma.workRequest.findFirst({
    where: { id: requestId, projectId: project.id },
  });

  if (!wr || wr.status !== "QUOTED") {
    return Response.json({ error: "Request not available to accept" }, { status: 400 });
  }

  if (!wr.projectClientId || wr.projectClientId !== client.id) {
    return Response.json({ error: "Not your request" }, { status: 403 });
  }
  const quote = wr.quotedAmount;
  if (quote == null) {
    return Response.json({ error: "No quote on this request" }, { status: 400 });
  }

  const out = await prisma.$transaction(async (tx) => {
    const pay = await tx.payment.create({
      data: {
        projectId: project.id,
        label: `Add-on: ${wr.title}`,
        description: [wr.description, wr.quotedNote].filter(Boolean).join("\n\n—\n"),
        lineKind: "CHANGE_ORDER",
        amount: quote,
        currency: project.currency,
        status: "PENDING",
        stripeLink: wr.stripeLink || undefined,
      },
    });
    const updated = await tx.workRequest.update({
      where: { id: wr.id },
      data: {
        status: "ACCEPTED",
        paymentId: pay.id,
        acceptedAt: new Date(),
      },
    });
    return { payment: pay, workRequest: updated };
  });

  return Response.json(out, { status: 200 });
}
