interface Payment {
  id: string;
  label: string;
  description?: string | null;
  lineKind?: string;
  amount: any;
  currency: string;
  status: string;
  dueDate: Date | null;
  paidDate: Date | null;
  stripeLink?: string | null;
}

interface PaymentSummaryProps {
  total: number;
  paid: number;
  currency: string;
  payments: Payment[];
}

export default function PaymentSummary({ total, paid, currency, payments }: PaymentSummaryProps) {
  const remaining = total - paid;
  const progressPct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const nextDue = payments.find(
    (p) => (p.status === "PENDING" || p.status === "OVERDUE") && p.dueDate
  );

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Total</p>
          <p className="text-lg font-bold text-white">{total.toLocaleString()} <span className="text-sm font-normal text-neutral-400">{currency}</span></p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-1">Paid</p>
          <p className="text-lg font-bold text-green-400">{paid.toLocaleString()} <span className="text-sm font-normal text-neutral-400">{currency}</span></p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-1">Remaining</p>
          <p className="text-lg font-bold text-white">{remaining.toLocaleString()} <span className="text-sm font-normal text-neutral-400">{currency}</span></p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-neutral-500 mb-1">
          <span>Paid {progressPct}%</span>
          {nextDue && nextDue.dueDate && (
            <span>Next due: {new Date(nextDue.dueDate).toLocaleDateString()}</span>
          )}
        </div>
        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      {payments.length > 0 && (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-t border-neutral-800">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-white">{p.label}</p>
                  {p.lineKind === "CHANGE_ORDER" && (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-200 border border-amber-800/50">
                      Add-on
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="text-xs text-neutral-500 mt-0.5 whitespace-pre-wrap">{p.description}</p>
                )}
                {p.paidDate && (
                  <p className="text-xs text-neutral-500">Paid {new Date(p.paidDate).toLocaleDateString()}</p>
                )}
                {p.dueDate && (p.status === "PENDING" || p.status === "OVERDUE") && (
                  <p
                    className={`text-xs ${
                      p.status === "OVERDUE" ||
                      (p.dueDate && new Date(p.dueDate) < new Date() && p.status === "PENDING")
                        ? "text-red-400"
                        : "text-neutral-500"
                    }`}
                  >
                    Due {new Date(p.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.stripeLink && (p.status === "PENDING" || p.status === "OVERDUE") && (
                  <a
                    href={p.stripeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Pay
                  </a>
                )}
                <span className="text-sm font-medium text-white">{Number(p.amount).toLocaleString()} {p.currency}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === "PAID"
                      ? "bg-green-900/50 text-green-300"
                      : p.status === "OVERDUE"
                        ? "bg-red-900/40 text-red-300"
                        : p.status === "CANCELLED"
                          ? "bg-neutral-800 text-neutral-500"
                          : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {p.status === "PAID"
                    ? "Paid"
                    : p.status === "OVERDUE"
                      ? "Overdue"
                      : p.status === "CANCELLED"
                        ? "Cancelled"
                        : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
