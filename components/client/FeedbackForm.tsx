"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { clientPortalJsonHeaders, getOrCreateClientSessionId } from "@/lib/client-session";
import { clientPortalApiBase } from "@/lib/client-portal-url";

const FEEDBACK_TYPES = [
  { key: "CHANGE_REQUEST", label: "Change Request", color: "bg-amber-900/40 border-amber-700 text-amber-300" },
  { key: "APPROVAL", label: "Approval", color: "bg-green-900/40 border-green-700 text-green-300", icon: Check },
  { key: "QUESTION", label: "Question", color: "bg-blue-900/40 border-blue-700 text-blue-300" },
];

interface FeedbackFormProps {
  portalSlug: string;
  portalToken: string;
  files: { id: string; label: string | null; versionNumber: number }[];
  defaultDisplayName?: string;
}

export default function FeedbackForm({
  portalSlug,
  portalToken,
  files,
  defaultDisplayName,
}: FeedbackFormProps) {
  const [type, setType] = useState("CHANGE_REQUEST");
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState(defaultDisplayName ?? "");
  const [fileId, setFileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const sessionId = getOrCreateClientSessionId();
    const res = await fetch(`${clientPortalApiBase(portalSlug, portalToken)}/feedback`, {
      method: "POST",
      headers: clientPortalJsonHeaders(sessionId),
      body: JSON.stringify({
        type,
        message,
        fileId: fileId || undefined,
        sessionId,
        displayName: displayName.trim() || undefined,
      }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      try {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Could not send feedback");
      } catch {
        setError("Could not send feedback");
      }
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-300 font-medium">Feedback sent!</p>
        <p className="text-neutral-400 text-sm mt-1">Your designer has been notified.</p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setMessage("");
          }}
          className="mt-4 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm font-medium text-neutral-300 mb-2">Feedback type</p>
          <div className="flex gap-2 flex-wrap">
            {FEEDBACK_TYPES.map(({ key, label, color, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setType(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  type === key ? color : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {files.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Which file? <span className="text-neutral-500 font-normal">(optional)</span>
            </label>
            <select
              value={fileId}
              onChange={(e) => setFileId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              <option value="">General feedback</option>
              {files.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label || "File"} (v{f.versionNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        {!defaultDisplayName && (
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Your name <span className="text-neutral-500 font-normal">(optional)</span>
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={120}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
              placeholder="How should we address you?"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Your message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            maxLength={500}
            rows={4}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 resize-none"
            placeholder="Describe your feedback clearly..."
          />
          <p className="text-xs text-neutral-600 mt-1">{message.length}/500</p>
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="w-full py-3 bg-white text-neutral-900 font-semibold rounded-lg text-sm hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending…" : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}
