import { prisma } from "@/lib/prisma";

/** When a milestone is marked PAID, optionally unlock final deliverables */
export async function applyPaymentUnlock(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { autoUnlockOnPayment: true, paymentGateEnabled: true },
  });

  if (!project?.autoUnlockOnPayment) return;

  await prisma.file.updateMany({
    where: {
      projectId,
      isFinalDeliverable: true,
      deletedAt: null,
    },
    data: {
      status: "FINAL",
      downloadAllowed: true,
    },
  });
}

/** Mark pending milestones as OVERDUE when past due date */
export async function refreshPaymentOverdue(projectId: string) {
  await prisma.payment.updateMany({
    where: {
      projectId,
      status: "PENDING",
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });
}
