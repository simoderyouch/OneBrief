/**
 * Prisma `Decimal` values cannot be passed from Server Components to Client Components.
 * Convert money fields to plain numbers before passing props.
 */
export function decimalToNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toNumber" in v && typeof (v as { toNumber: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type PaymentRow = {
  amount: unknown;
  [key: string]: unknown;
};

type ProjectWithPayments = {
  totalPrice?: unknown | null;
  payments?: PaymentRow[];
  [key: string]: unknown;
};

export function serializeProjectForClient<P extends ProjectWithPayments>(project: P) {
  const payments = (project.payments ?? []).map((p) => {
    const { amount: rawAmount, ...rest } = p;
    return {
      ...rest,
      amount: decimalToNumber(rawAmount) ?? 0,
    };
  });

  return {
    ...project,
    totalPrice: decimalToNumber(project.totalPrice),
    payments,
  };
}

export function serializeProjectsForClient<T extends ProjectWithPayments>(projects: T[]) {
  return projects.map((p) => serializeProjectForClient(p));
}
