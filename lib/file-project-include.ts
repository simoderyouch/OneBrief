/** Shared Prisma include for file routes that enforce payment gates */
export const fileProjectInclude = {
  project: {
    select: {
      id: true,
      securityTier: true,
      clientName: true,
      paymentGateEnabled: true,
      paymentGateMode: true,
      paymentGateMilestoneId: true,
      payments: { select: { id: true, status: true, lineKind: true } },
    },
  },
} as const;
