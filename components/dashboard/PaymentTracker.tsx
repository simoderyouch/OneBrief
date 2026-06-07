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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-neutral-300 mb-1">Payment milestones</h3>
      <p className="text-xs text-neutral-500 mb-3">
        Original quote lines. Extra scope from the client goes through <strong className="text-neutral-400">Extra work requests</strong> first, then appears here when they accept.
      </p>
      <div className="space-y-2 mb-4">
        {payments.length === 0 ? (
          <p className="text-xs text-neutral-500">No payment lines yet.</p>
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
                className={`flex flex-wrap items-center justify-between gap-2 py-2 border-t border-neutral-800 first:border-t-0 first:pt-0 ${
                  overdue ? "bg-red-950/20 -mx-2 px-2 rounded-lg" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-white">{p.label}</p>
                    {isChange && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-200 border border-amber-800/50">
                        From request
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-neutral-500 mt-0.5 whitespace-pre-wrap">{p.description}</p>
                  )}
                  {p.dueDate && (p.status === "PENDING" || p.status === "OVERDUE") && (
                    <p className={`text-xs ${overdue ? "text-red-400" : "text-neutral-500"}`}>
                      Due {new Date(p.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-white">
                    {Number(p.amount).toLocaleString()} {p.currency}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === "PAID"
                        ? "bg-green-900/50 text-green-300"
                        : p.status === "OVERDUE" || overdue
                          ? "bg-red-900/40 text-red-300"
                          : p.status === "CANCELLED"
                            ? "bg-neutral-800 text-neutral-500"
                            : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {p.status}
                  </span>
                  {p.stripeLink && (
                    <a
                      href={p.stripeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Pay
                    </a>
                  )}
                  {p.status !== "PAID" && p.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => markPaid(p.id)}
                      className="text-xs px-2 py-1 bg-neutral-800 rounded text-neutral-300 hover:bg-neutral-700"
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

      <form onSubmit={addMilestone} className="space-y-2 border-t border-neutral-800 pt-4">
        <p className="text-xs font-medium text-neutral-400 mb-2">Add milestone</p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. Deposit, Final)"
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount (${currency})`}
            className="flex-1 min-w-[120px] px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
          />
        </div>
        <input
          value={stripeLinkM}
          onChange={(e) => setStripeLinkM(e.target.value)}
          placeholder="Payment link (optional)"
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-white text-neutral-900 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add milestone"}
        </button>
      </form>
    </div>
  );
}
