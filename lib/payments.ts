import { prisma } from "@/lib/prisma";

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
