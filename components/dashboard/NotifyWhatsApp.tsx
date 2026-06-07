"use client";

import { useState } from "react";

type TemplateKey =
  | "portal_link"
  | "new_version"
  | "review_ready"
  | "payment_recorded"
  | "approval_needed";

const TEMPLATES: { key: TemplateKey; label: string }[] = [
  { key: "portal_link", label: "Share portal link" },
  { key: "new_version", label: "New version ready" },
  { key: "review_ready", label: "Ready for review" },
  { key: "approval_needed", label: "Waiting for approval" },
  { key: "payment_recorded", label: "Payment recorded" },
];

interface NotifyWhatsAppProps {
  projectId: string;
  clientWhatsapp: string | null;
}

export default function NotifyWhatsApp({ projectId, clientWhatsapp }: NotifyWhatsAppProps) {
  const [template, setTemplate] = useState<TemplateKey>("portal_link");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const hasPhone = Boolean(clientWhatsapp?.trim());

  async function openWhatsApp() {
    setLoading(true);
    setError(null);
    setPreview(null);

    const res = await fetch(`/api/projects/${projectId}/notify/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not build WhatsApp link");
      return;
    }

    setPreview(data.message);
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-neutral-300 mb-1">Notify on WhatsApp</h3>
      <p className="text-xs text-neutral-500 mb-4">
        Opens WhatsApp with a pre-filled message and your portal link. Client still reviews in the portal — not in chat.
      </p>

      {!hasPhone ? (
        <p className="text-xs text-neutral-500 bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-2">
          Add client WhatsApp in <strong>Edit</strong> (e.g. 0612345678).
        </p>
      ) : (
        <>
          <p className="text-xs text-neutral-500 mb-2">Client: {clientWhatsapp}</p>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateKey)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white mb-3"
          >
            {TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openWhatsApp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {loading ? "Opening…" : "Open WhatsApp"}
          </button>
        </>
      )}

      {error && (
        <p className="text-xs text-neutral-500 mt-3" role="alert">
          {error}
        </p>
      )}

      {preview && (
        <p className="text-xs text-neutral-500 mt-3 whitespace-pre-wrap border-t border-neutral-800 pt-3">
          {preview}
        </p>
      )}
    </div>
  );
}
