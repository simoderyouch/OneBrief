"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { feedbackSubmitterLabel } from "@/lib/feedback-display";
import { clientPortalJsonHeaders, getOrCreateClientSessionId } from "@/lib/client-session";
import { clientPortalApiBase } from "@/lib/client-portal-url";

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
  currency?: string;
  messages?: Msg[];
};

export default function ClientWorkRequests({
  portalSlug,
  portalToken,
  currency,
  defaultDisplayName,
  initialRequests,
}: {
  portalSlug: string;
  portalToken: string;
  currency: string;
  defaultDisplayName?: string;
  initialRequests: WR[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [replyByRequest, setReplyByRequest] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sessionId = getOrCreateClientSessionId();
    const res = await fetch(`${clientPortalApiBase(portalSlug, portalToken)}/work-requests`, {
      method: "POST",
      headers: clientPortalJsonHeaders(sessionId),
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        sessionId,
        displayName: defaultDisplayName?.trim() || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      try {
        const d = (await res.json()) as { error?: string };
        setError(d.error || "Could not send request");
      } catch {
        setError("Could not send request");
      }
      return;
    }
    setTitle("");
    setDescription("");
    router.refresh();
  }

  async function sendReply(requestId: string) {
    const text = (replyByRequest[requestId] || "").trim();
    if (!text) return;
    setReplying(requestId);
    setError(null);
    const sessionId = getOrCreateClientSessionId();
    const api = clientPortalApiBase(portalSlug, portalToken);
    const res = await fetch(`${api}/work-requests/${requestId}/messages`, {
      method: "POST",
      headers: clientPortalJsonHeaders(sessionId),
      body: JSON.stringify({ message: text, sessionId }),
    });
    setReplying(null);
    if (res.ok) {
      setReplyByRequest((prev) => ({ ...prev, [requestId]: "" }));
      router.refresh();
    } else {
      try {
        const d = (await res.json()) as { error?: string };
        setError(d.error || "Could not send reply");
      } catch {
        setError("Could not send reply");
      }
    }
  }

  async function accept(id: string) {
    setActing(id);
    const api = clientPortalApiBase(portalSlug, portalToken);
    const res = await fetch(`${api}/work-requests/${id}/accept`, { method: "POST" });
    setActing(null);
    if (res.ok) router.refresh();
    else {
      try {
        const d = (await res.json()) as { error?: string };
        setError(d.error || "Could not accept");
      } catch {
        setError("Could not accept");
      }
    }
  }

  async function decline(id: string) {
    setActing(id);
    const api = clientPortalApiBase(portalSlug, portalToken);
    const res = await fetch(`${api}/work-requests/${id}/decline`, { method: "POST" });
    setActing(null);
    if (res.ok) router.refresh();
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case "PENDING":
        return "In discussion";
      case "QUOTED":
        return "Quote sent";
      case "ACCEPTED":
        return "Added to project";
      case "DECLINED":
        return "Declined";
      default:
        return s;
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Request more work</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Describe what you&apos;d like added. You and your freelancer can discuss details first; when you both agree,
          they&apos;ll send a price. If you accept the quote, it&apos;s added to this project as a payable line.
        </p>
        <form onSubmit={submitRequest} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short title (e.g. Extra hero animation)"
            maxLength={200}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What you need — you can refine this in the thread after sending"
            rows={4}
            required
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm resize-none"
          />
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !title.trim() || !description.trim()}
            className="w-full py-2.5 bg-white text-neutral-900 font-semibold rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? "Sending…" : "Start request"}
          </button>
        </form>
      </div>

      {initialRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-300 mb-3">Your requests</h3>
          <ul className="space-y-3">
            {initialRequests.map((r) => (
              <li
                key={r.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-white">{r.title}</p>
                  <span className="text-[10px] uppercase tracking-wide text-neutral-500">
                    {statusLabel(r.status)}
                  </span>
                </div>
                <p className="text-neutral-400 whitespace-pre-wrap mb-3 text-xs border-l-2 border-neutral-600 pl-3">
                  <span className="text-neutral-500 block mb-1">Original ask</span>
                  {r.description}
                </p>
                <p className="text-xs text-neutral-600 mb-3">
                  From:{" "}
                  {feedbackSubmitterLabel(r.submittedByName, r.submittedBySessionId, r.projectClient)}
                </p>

                {(r.messages?.length ?? 0) > 0 && (
                  <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
                    {r.messages!.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-lg px-3 py-2 text-xs whitespace-pre-wrap ${
                          m.fromClient
                            ? "bg-neutral-800 text-neutral-200 ml-4"
                            : "bg-blue-950/40 text-blue-100 border border-blue-900/40 mr-4"
                        }`}
                      >
                        <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
                          {m.fromClient ? "You" : "Freelancer"}
                        </p>
                        {m.body}
                      </div>
                    ))}
                  </div>
                )}

                {r.status === "PENDING" && (
                  <div className="border-t border-neutral-800 pt-3 space-y-2">
                    <p className="text-xs text-neutral-500">Reply in the thread (no price yet)</p>
                    <textarea
                      value={replyByRequest[r.id] ?? ""}
                      onChange={(e) =>
                        setReplyByRequest((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      placeholder="Ask questions or refine scope…"
                      rows={2}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => sendReply(r.id)}
                      disabled={replying === r.id || !(replyByRequest[r.id] || "").trim()}
                      className="w-full py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      {replying === r.id ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                )}

                {r.status === "QUOTED" && r.quotedAmount != null && (
                  <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2">
                    <p className="text-xs text-amber-200/90 font-medium">Price offer</p>
                    <p className="text-white">
                      <span className="text-neutral-500">Quote:</span>{" "}
                      {Number(r.quotedAmount).toLocaleString()} {currency}
                    </p>
                    {r.quotedNote && (
                      <p className="text-neutral-400 text-xs whitespace-pre-wrap">{r.quotedNote}</p>
                    )}
                    {r.stripeLink && (
                      <a
                        href={r.stripeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs text-blue-400 hover:underline"
                      >
                        Open payment link
                      </a>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => accept(r.id)}
                        disabled={acting === r.id}
                        className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        {acting === r.id ? "…" : "Accept & add to project"}
                      </button>
                      <button
                        type="button"
                        onClick={() => decline(r.id)}
                        disabled={acting === r.id}
                        className="px-3 py-2 border border-neutral-600 text-neutral-400 rounded-lg text-xs hover:bg-neutral-800"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
