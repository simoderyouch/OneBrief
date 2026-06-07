import { prisma } from "@/lib/prisma";
import { resolvePublicProject } from "@/lib/public-project";
import { getProjectClientFromRequest } from "@/lib/project-client-auth";
import { NextRequest } from "next/server";

const MAX_LEN = 4000;

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

  const body = await request.json();
  const text = typeof body.message === "string" ? body.message.trim() : "";

  if (!text) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }
  if (text.length > MAX_LEN) {
    return Response.json({ error: `Message must be ${MAX_LEN} characters or less` }, { status: 400 });
  }

  const wr = await prisma.workRequest.findFirst({
    where: { id: requestId, projectId: project.id },
  });

  if (!wr || wr.status !== "PENDING") {
    return Response.json(
      { error: "You can only reply while this request is open for discussion (before a price is sent)." },
      { status: 400 }
    );
  }

  if (!wr.projectClientId) {
    return Response.json(
      {
        error:
          "This request was created before portal sign-in. Ask your freelancer to reopen or contact them directly.",
      },
      { status: 403 }
    );
  }
  if (wr.projectClientId !== client.id) {
    return Response.json({ error: "Not your request" }, { status: 403 });
  }

  const msg = await prisma.workRequestMessage.create({
    data: {
      workRequestId: wr.id,
      fromClient: true,
      body: text,
    },
  });

  return Response.json(msg, { status: 201 });
}
