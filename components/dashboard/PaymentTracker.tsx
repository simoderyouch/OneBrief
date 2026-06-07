"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Milestone = {
  id: string;
  label: string;
  description: string | null;
  lineKind?: string;
  amount: unknown;
  currency: string;
  status: string;
  dueDate: Date | null;
  paidDate: Date | null;
  stripeLink: string | null;
};

function statusClass(status: string, overdue: boolean) {
  if (status === "PAID") return "status-paid";
  if (status === "OVERDUE" || overdue) return "status-overdue";
  if (status === "CANCELLED") return "badge text-neutral-600";
  return "status-pending";
}

export default function PaymentTracker({
  projectId,
  currency,
  payments,
}: {
  projectId: string;
  currency: string;
  payments: Milestone[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [stripeLinkM, setStripeLinkM] = useState("");
  const [saving, setSaving] = useState(false);

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !amount) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim(),
        amount: parseFloat(amount),
        dueDate: due || undefined,
        lineKind: "MILESTONE",
        stripeLink: stripeLinkM.trim() || undefined,
      }),
    });
    setLabel("");
    setAmount("");
    setDue("");
    setStripeLinkM("");
    setSaving(false);
    router.refresh();
  }

  async function markPaid(id: string) {
    await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });
    router.refresh();
  }

  return (
    <div className="panel-padded">
      <h3 className="text-sm font-medium text-neutral-300 mb-1">Payment milestones</h3>
      <p className="text-xs text-neutral-600 mb-3">
        Original quote lines. Extra scope from the client goes through <strong className="text-neutral-500 font-medium">Extra work requests</strong> first, then appears here when they accept.
      </p>
      <div className="space-y-2 mb-4">
        {payments.length === 0 ? (
          <p className="text-xs text-neutral-600">No payment lines yet.</p>
        ) : (
          payments.map((p) => {
            const isChange = p.lineKind === "CHANGE_ORDER";
            const overdue =
              (p.status === "PENDING" || p.status === "OVERDUE") &&
              p.dueDate &&
              new Date(p.dueDate) < new Date();
            return (
              <div
                key={p.id}
                className={`flex flex-wrap items-center justify-between gap-2 py-2 border-t border-neutral-800/60 first:border-t-0 first:pt-0 ${
                  overdue ? "bg-neutral-900/50 -mx-2 px-2 rounded-lg" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-neutral-200">{p.label}</p>
                    {isChange && (
                      <span className="badge-warn">From request</span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-neutral-600 mt-0.5 whitespace-pre-wrap">{p.description}</p>
                  )}
                  {p.dueDate && (p.status === "PENDING" || p.status === "OVERDUE") && (
                    <p className={`text-xs ${overdue ? "text-neutral-500" : "text-neutral-600"}`}>
                      Due {new Date(p.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-money">
                    {Number(p.amount).toLocaleString()} {p.currency}
                  </span>
                  <span className={statusClass(p.status, !!overdue)}>
                    {p.status}
                  </span>
                  {p.stripeLink && (
                    <a
                      href={p.stripeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs link-subtle no-underline hover:underline"
                    >
                      Pay
                    </a>
                  )}
                  {p.status !== "PAID" && p.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => markPaid(p.id)}
                      className="text-xs px-2 py-1 bg-neutral-800/80 rounded text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 transition-colors"
                    >
                      Mark paid
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={addMilestone} className="space-y-2 border-t border-neutral-800/60 pt-4">
        <p className="text-xs font-medium text-neutral-500 mb-2">Add milestone</p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. Deposit, Final)"
          className="input-field"
        />
        <div className="flex gap-2 flex-wrap">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount (${currency})`}
            className="input-field flex-1 min-w-[120px]"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="input-field w-auto"
          />
        </div>
        <input
          value={stripeLinkM}
          onChange={(e) => setStripeLinkM(e.target.value)}
          placeholder="Payment link (optional)"
          className="input-field"
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-2.5 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Add milestone"}
        </button>
      </form>
    </div>
  );
}
