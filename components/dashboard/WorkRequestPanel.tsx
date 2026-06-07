"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { feedbackSubmitterLabel } from "@/lib/feedback-display";

type Msg = { id: string; fromClient: boolean; body: string; createdAt: string };

type WR = {
  id: string;
  title: string;
  description: string;
  status: string;
  submittedByName?: string | null;
  submittedBySessionId?: string | null;
  projectClient?: { fullName: string } | null;
  quotedAmount?: unknown;
  quotedNote?: string | null;
  stripeLink?: string | null;
  messages?: Msg[];
};

export default function WorkRequestPanel({
  projectId,
  currency,
  requests,
}: {
  projectId: string;
  currency: string;
  requests: WR[];
}) {
  const router = useRouter();
  const [quoteFor, setQuoteFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [stripe, setStripe] = useState("");
  const [saving, setSaving] = useState(false);
  const [replyByRequest, setReplyByRequest] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  async function sendMessage(requestId: string) {
    const text = (replyByRequest[requestId] || "").trim();
    if (!text) return;
    setReplying(requestId);
    await fetch(`/api/projects/${projectId}/work-requests/${requestId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    setReplying(null);
    setReplyByRequest((prev) => ({ ...prev, [requestId]: "" }));
    router.refresh();
  }

  async function sendQuote(requestId: string) {
    const a = parseFloat(amount);
    if (!Number.isFinite(a) || a <= 0) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}/work-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quotedAmount: a,
        quotedNote: note.trim() || undefined,
        stripeLink: stripe.trim() || undefined,
      }),
    });
    setSaving(false);
    setQuoteFor(null);
    setAmount("");
    setNote("");
    setStripe("");
    router.refresh();
  }

  async function declineRequest(requestId: string) {
    setSaving(true);
    await fetch(`/api/projects/${projectId}/work-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DECLINED" }),
    });
    setSaving(false);
    router.refresh();
  }

  if (requests.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-1">Extra work requests</h2>
        <p className="text-xs text-neutral-500">
          Clients can request new scope from their link. You&apos;ll discuss first, then send a price when ready.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <h2 className="font-semibold text-white mb-3">Extra work requests</h2>
      <p className="text-xs text-neutral-500 mb-4">
        Chat with the client to clarify scope. When you agree on what to build, use <strong className="text-neutral-400">Send price</strong> — that locks the thread and shows them the quote to accept or decline.
      </p>
      <ul className="space-y-4">
        {requests.map((r) => (
          <li key={r.id} className="border border-neutral-800 rounded-lg p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <p className="font-medium text-white">{r.title}</p>
              <span
                className={`text-[10px] uppercase px-2 py-0.5 rounded ${
                  r.status === "PENDING"
                    ? "bg-amber-900/40 text-amber-200"
                    : r.status === "QUOTED"
                      ? "bg-blue-900/40 text-blue-200"
                      : r.status === "ACCEPTED"
                        ? "bg-green-900/40 text-green-200"
                        : "bg-neutral-800 text-neutral-500"
                }`}
              >
                {r.status === "PENDING" ? "Discussing" : r.status}
              </span>
            </div>
            <p className="text-neutral-400 whitespace-pre-wrap mb-2 text-xs border-l-2 border-neutral-600 pl-2">
              <span className="text-neutral-500">Client ask — </span>
              {r.description}
            </p>
            <p className="text-xs text-neutral-600 mb-3">
              From: {feedbackSubmitterLabel(r.submittedByName, r.submittedBySessionId, r.projectClient)}
            </p>

            {(r.messages?.length ?? 0) > 0 && (
              <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
                {r.messages!.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg px-3 py-2 text-xs whitespace-pre-wrap ${
                      m.fromClient
                        ? "bg-amber-950/30 text-amber-100 border border-amber-900/30 mr-6"
                        : "bg-neutral-800 text-neutral-200 ml-6"
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
                      {m.fromClient ? "Client" : "You"}
                    </p>
                    {m.body}
                  </div>
                ))}
              </div>
            )}

            {r.status === "PENDING" && (
              <div className="mt-3 space-y-3 border-t border-neutral-800 pt-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Reply (discussion — no price yet)</p>
                  <textarea
                    value={replyByRequest[r.id] ?? ""}
                    onChange={(e) =>
                      setReplyByRequest((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    placeholder="Questions, options, timeline…"
                    rows={2}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm resize-none"
                  />
                  <button
                    type="button"
                    disabled={replying === r.id || !(replyByRequest[r.id] || "").trim()}
                    onClick={() => sendMessage(r.id)}
                    className="mt-2 w-full py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {replying === r.id ? "Sending…" : "Send message"}
                  </button>
                </div>

                {quoteFor === r.id ? (
                  <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-blue-200 font-medium">Send final price</p>
                    <p className="text-[11px] text-neutral-500">
                      This ends discussion and shows the client a fixed quote to accept or decline.
                    </p>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Price (${currency})`}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                    />
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What’s included in this price (optional)"
                      rows={2}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm resize-none"
                    />
                    <input
                      value={stripe}
                      onChange={(e) => setStripe(e.target.value)}
                      placeholder="Payment / invoice link (optional)"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => sendQuote(r.id)}
                        className="flex-1 py-2 bg-white text-neutral-900 rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        {saving ? "…" : "Send price to client"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuoteFor(null);
                          setAmount("");
                          setNote("");
                          setStripe("");
                        }}
                        className="px-3 py-2 text-neutral-500 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setQuoteFor(r.id)}
                      className="px-3 py-2 bg-blue-600/90 text-white rounded-lg text-xs font-semibold"
                    >
                      Send price
                    </button>
                    <button
                      type="button"
                      onClick={() => declineRequest(r.id)}
                      disabled={saving}
                      className="px-3 py-2 border border-neutral-700 text-neutral-400 rounded-lg text-xs"
                    >
                      Decline request
                    </button>
                  </div>
                )}
              </div>
            )}

            {r.status === "QUOTED" && r.quotedAmount != null && (
              <p className="text-xs text-neutral-500 mt-2">
                Quoted {Number(r.quotedAmount).toLocaleString()} {currency} — waiting for client
              </p>
            )}
            {r.status === "ACCEPTED" && (
              <p className="text-xs text-green-500/90 mt-2">Added to project payments.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
