import { describe, expect, it } from "vitest";
import { isPaymentGateSatisfied } from "@/lib/payment-gate";

describe("payment-gate", () => {
  it("passes when gate disabled", () => {
    expect(
      isPaymentGateSatisfied({
        paymentGateEnabled: false,
        paymentGateMode: "ALL_MILESTONES_PAID",
        paymentGateMilestoneId: null,
        payments: [{ id: "1", status: "PENDING", lineKind: "MILESTONE" }],
      })
    ).toBe(true);
  });

  it("requires all milestones paid", () => {
    expect(
      isPaymentGateSatisfied({
        paymentGateEnabled: true,
        paymentGateMode: "ALL_MILESTONES_PAID",
        paymentGateMilestoneId: null,
        payments: [
          { id: "1", status: "PAID", lineKind: "MILESTONE" },
          { id: "2", status: "PENDING", lineKind: "MILESTONE" },
        ],
      })
    ).toBe(false);
  });

  it("requires deposit (first milestone) paid", () => {
    expect(
      isPaymentGateSatisfied({
        paymentGateEnabled: true,
        paymentGateMode: "DEPOSIT_PAID",
        paymentGateMilestoneId: null,
        payments: [{ id: "1", status: "PAID", lineKind: "MILESTONE" }],
      })
    ).toBe(true);
  });
});
