import { getAuthenticatedUser, isDatabaseConnectivityError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
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

  try {
    const wr = await prisma.workRequest.findFirst({
      where: { id: requestId, projectId },
      include: { project: { select: { userId: true, currency: true } } },
    });

    if (!wr || wr.project.userId !== authResult.user.id) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (body.status === "DECLINED" && wr.status === "PENDING") {
      const updated = await prisma.workRequest.update({
        where: { id: wr.id },
        data: { status: "DECLINED" },
      });
      return Response.json(updated);
    }

    const amt = body.quotedAmount != null ? parseFloat(String(body.quotedAmount)) : NaN;
    if (Number.isFinite(amt) && amt > 0) {
      if (wr.status !== "PENDING") {
        return Response.json({ error: "Can only quote pending requests" }, { status: 400 });
      }
      const quotedNote =
        typeof body.quotedNote === "string" ? body.quotedNote.trim() || null : null;
      const stripeLink =
        typeof body.stripeLink === "string" && body.stripeLink.trim()
          ? body.stripeLink.trim()
          : null;

      const updated = await prisma.workRequest.update({
        where: { id: wr.id },
        data: {
          status: "QUOTED",
          quotedAmount: amt,
          quotedNote,
          stripeLink,
        },
      });
      return Response.json(updated);
    }

    return Response.json({ error: "Send quotedAmount (> 0) or status DECLINED for pending" }, { status: 400 });
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
