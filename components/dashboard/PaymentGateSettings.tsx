"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  projectId: string;
  paymentGateEnabled: boolean;
  paymentGateMode: string;
  paymentGateMilestoneId: string | null;
  autoUnlockOnPayment: boolean;
  milestones: { id: string; label: string }[];
};

export default function PaymentGateSettings({
  projectId,
  paymentGateEnabled,
  paymentGateMode,
  paymentGateMilestoneId,
  autoUnlockOnPayment,
  milestones,
}: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(paymentGateEnabled);
  const [mode, setMode] = useState(paymentGateMode);
  const [milestoneId, setMilestoneId] = useState(paymentGateMilestoneId || "");
  const [autoUnlock, setAutoUnlock] = useState(autoUnlockOnPayment);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentGateEnabled: enabled,
        paymentGateMode: mode,
        paymentGateMilestoneId: milestoneId || null,
        autoUnlockOnPayment: autoUnlock,
      }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <h2 className="font-semibold text-white mb-2">Payment gate</h2>
      <p className="text-xs text-neutral-500 mb-4">
        Block final downloads until milestones are marked paid (tracking only — no in-app payment).
      </p>
      <label className="flex items-center gap-2 text-sm text-neutral-300 mb-3">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enable payment gate
      </label>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white mb-3"
      >
        <option value="NONE">No gate rules</option>
        <option value="DEPOSIT_PAID">First milestone paid</option>
        <option value="ALL_MILESTONES_PAID">All milestones paid</option>
        <option value="SPECIFIC_MILESTONE">Specific milestone paid</option>
      </select>
      {mode === "SPECIFIC_MILESTONE" && (
        <select
          value={milestoneId}
          onChange={(e) => setMilestoneId(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white mb-3"
        >
          <option value="">Select milestone</option>
          {milestones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      )}
      <label className="flex items-center gap-2 text-sm text-neutral-300 mb-4">
        <input type="checkbox" checked={autoUnlock} onChange={(e) => setAutoUnlock(e.target.checked)} />
        Auto-unlock final deliverables when paid
      </label>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save gate settings"}
      </button>
    </section>
  );
}
