import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PaymentLineKind } from "@prisma/client";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const payment = await prisma.payment.findFirst({
    where: { id },
    include: { project: true },
  });

  if (!payment || payment.project.userId !== session.user.id) {
    return Response.json({ error: "Payment not found" }, { status: 404 });
  }

  const data: {
    status?: typeof body.status;
    paidDate?: Date | null;
    label?: string;
    description?: string | null;
    amount?: number;
    currency?: string;
    dueDate?: Date | null;
    note?: string | null;
    stripeLink?: string | null;
    lineKind?: PaymentLineKind;
  } = {};

  if (body.status !== undefined) {
    data.status = body.status;
    data.paidDate =
      body.status === "PAID"
        ? body.paidDate
          ? new Date(body.paidDate)
          : new Date()
        : null;
  }
  if (body.label !== undefined) data.label = body.label;
  if (body.description !== undefined) data.description = body.description;
  if (body.amount !== undefined) data.amount = parseFloat(body.amount);
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.dueDate !== undefined) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if (body.note !== undefined) data.note = body.note;
  if (body.stripeLink !== undefined) data.stripeLink = body.stripeLink;
  if (body.lineKind === "CHANGE_ORDER" || body.lineKind === "MILESTONE") {
    data.lineKind = body.lineKind;
  }

  const updated = await prisma.payment.update({
    where: { id },
    data,
  });

  return Response.json(updated);
}
