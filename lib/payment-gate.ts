import type { FileStatus, Payment, PaymentGateMode, PaymentStatus } from "@prisma/client";

export type PaymentGateContext = {
  paymentGateEnabled: boolean;
  paymentGateMode: PaymentGateMode;
  paymentGateMilestoneId: string | null;
  payments: Pick<Payment, "id" | "status" | "lineKind">[];
};

export function isPaymentGateSatisfied(ctx: PaymentGateContext): boolean {
  if (!ctx.paymentGateEnabled || ctx.paymentGateMode === "NONE") {
    return true;
  }

  const milestones = ctx.payments.filter((p) => p.lineKind === "MILESTONE");

  if (ctx.paymentGateMode === "ALL_MILESTONES_PAID") {
    if (milestones.length === 0) return true;
    return milestones.every((p) => p.status === "PAID");
  }

  if (ctx.paymentGateMode === "SPECIFIC_MILESTONE" && ctx.paymentGateMilestoneId) {
    const target = milestones.find((p) => p.id === ctx.paymentGateMilestoneId);
    if (!target) return true;
    return target.status === "PAID";
  }

  if (ctx.paymentGateMode === "DEPOSIT_PAID") {
    const deposit = milestones[0];
    if (!deposit) return true;
    return deposit.status === "PAID";
  }

  return true;
}

export function paymentGateBlocksDownload(ctx: PaymentGateContext): boolean {
  return ctx.paymentGateEnabled && !isPaymentGateSatisfied(ctx);
}

export function canDownloadWithPaymentGate(params: {
  gate: PaymentGateContext;
  file: { downloadAllowed: boolean; status: FileStatus; isFinalDeliverable: boolean };
  baseCanDownload: boolean;
}): boolean {
  if (paymentGateBlocksDownload(params.gate)) {
    if (params.file.isFinalDeliverable) return false;
    if (params.file.status === "FINAL") return false;
  }
  return params.baseCanDownload;
}

export function summarizePaymentProgress(
  payments: Pick<Payment, "amount" | "status">[]
): { total: number; paid: number; outstanding: number } {
  const total = payments.reduce((s, p) => s + Number(p.amount), 0);
  const paid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + Number(p.amount), 0);
  return { total, paid, outstanding: total - paid };
}

export function countOverduePayments(
  payments: Pick<Payment, "status">[]
): number {
  return payments.filter((p) => p.status === "OVERDUE").length;
}
