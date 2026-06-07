import { getAuthenticatedUser, isDatabaseConnectivityError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const MAX_LEN = 4000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const authResult = await getAuthenticatedUser();
  if (!authResult.ok) {
    if (authResult.reason === "database_unavailable") {
      return Response.json({ error: authResult.message }, { status: 503 });
    }
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, requestId } = await params;
  const body = await request.json();
  const text = typeof body.message === "string" ? body.message.trim() : "";

  if (!text) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }
  if (text.length > MAX_LEN) {
    return Response.json({ error: `Message must be ${MAX_LEN} characters or less` }, { status: 400 });
  }

  try {
    const wr = await prisma.workRequest.findFirst({
      where: { id: requestId, projectId },
      include: { project: { select: { userId: true } } },
    });

    if (!wr || wr.project.userId !== authResult.user.id) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (wr.status !== "PENDING") {
      return Response.json(
        { error: "Discussion is closed — a price was already sent or the request ended." },
        { status: 400 }
      );
    }

    const msg = await prisma.workRequestMessage.create({
      data: {
        workRequestId: wr.id,
        fromClient: false,
        body: text,
      },
    });

    return Response.json(msg, { status: 201 });
  } catch (err) {
    if (isDatabaseConnectivityError(err)) {
      return Response.json(
        { error: "Database temporarily unavailable. Try again in a moment." },
        { status: 503 }
      );
    }
    throw err;
  }
}
