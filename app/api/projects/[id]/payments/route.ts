import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const payments = await prisma.payment.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(payments);
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

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const rawKind = body.lineKind;
  if (rawKind === "CHANGE_ORDER") {
    return Response.json(
      {
        error:
          "Change-order lines are created when a client accepts a quoted work request — not added here.",
      },
      { status: 400 }
    );
  }
  if (typeof body.label !== "string" || !body.label.trim()) {
    return Response.json({ error: "Label is required" }, { status: 400 });
  }
  const amt = parseFloat(body.amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return Response.json({ error: "Valid amount is required" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      projectId: id,
      label: body.label.trim(),
      description: typeof body.description === "string" ? body.description : undefined,
      lineKind: "MILESTONE",
      amount: amt,
      currency: body.currency || project.currency,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      note: typeof body.note === "string" ? body.note : undefined,
      stripeLink: typeof body.stripeLink === "string" && body.stripeLink.trim() ? body.stripeLink.trim() : undefined,
    },
  });

  return Response.json(payment, { status: 201 });
}
