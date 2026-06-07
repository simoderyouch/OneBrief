"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { feedbackSubmitterLabel } from "@/lib/feedback-display";

const TYPE_STYLES: Record<string, string> = {
  CHANGE_REQUEST: "badge-warn",
  APPROVAL: "badge-ok",
  QUESTION: "badge",
};

const TYPE_LABELS: Record<string, string> = {
  CHANGE_REQUEST: "Change Request",
  APPROVAL: "Approval",
  QUESTION: "Question",
};

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  status: string;
  createdAt: Date;
  submittedByName?: string | null;
  submittedBySessionId?: string | null;
  projectClient?: { fullName: string } | null;
  file?: { label: string | null; versionNumber: number } | null;
}

export default function FeedbackList({ feedbackItems, projectId }: { feedbackItems: FeedbackItem[]; projectId: string }) {
  const router = useRouter();
  const [resolving, setResolving] = useState<string | null>(null);

  async function handleResolve(feedbackId: string) {
    setResolving(feedbackId);
    await fetch(`/api/feedback/${feedbackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    setResolving(null);
    router.refresh();
  }

  const open = feedbackItems.filter((f) => f.status === "OPEN" || f.status === "IN_PROGRESS");
  const resolved = feedbackItems.filter((f) => f.status === "RESOLVED");

  if (feedbackItems.length === 0) {
    return (
      <p className="text-neutral-500 text-sm text-center py-8">No feedback yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {open.map((item) => (
        <div key={item.id} className="panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`text-xs font-medium ${TYPE_STYLES[item.type] || "badge"}`}>
                  {TYPE_LABELS[item.type] || item.type}
                </span>
                <span className="text-xs text-neutral-500">
                  {feedbackSubmitterLabel(
                    item.submittedByName,
                    item.submittedBySessionId,
                    item.projectClient
                  )}
                </span>
                {item.file && (
                  <span className="text-xs text-neutral-500">
                    on {item.file.label || "File"} v{item.file.versionNumber}
                  </span>
                )}
                <span className="text-xs text-neutral-600">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-neutral-200">{item.message}</p>
            </div>
            <button
              onClick={() => handleResolve(item.id)}
              disabled={resolving === item.id}
              className="shrink-0 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {resolving === item.id ? "…" : "Resolve"}
            </button>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <details className="group">
          <summary className="text-xs text-neutral-600 cursor-pointer hover:text-neutral-400 transition-colors py-2">
            {resolved.length} resolved item{resolved.length > 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-2">
            {resolved.map((item) => (
              <div key={item.id} className="bg-neutral-900/50 border border-neutral-800/50 rounded-lg p-3 opacity-60">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-medium ${TYPE_STYLES[item.type] || "badge"}`}>
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {feedbackSubmitterLabel(
                      item.submittedByName,
                      item.submittedBySessionId,
                      item.projectClient
                    )}
                  </span>
                  <span className="text-xs text-neutral-600">Resolved</span>
                </div>
                <p className="text-sm text-neutral-400 line-through">{item.message}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
