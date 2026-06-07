"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientNotesForm({
  clientEmail,
  clientName,
  initialNotes,
}: {
  clientEmail: string;
  clientName: string | null;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientEmail, clientName, notes }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-4 pt-4 border-t border-neutral-800">
      <label className="block text-xs text-neutral-500 mb-1">Private notes</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
        placeholder="Pays on time, prefers email…"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-2 text-xs text-neutral-300 hover:text-white"
      >
        {saving ? "Saving…" : "Save notes"}
      </button>
    </div>
  );
}
