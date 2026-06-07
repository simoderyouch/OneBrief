const TYPE_STYLES: Record<string, string> = {
  CHANGE_REQUEST: "bg-amber-900/40 text-amber-300 border border-amber-800/50",
  APPROVAL: "bg-green-900/40 text-green-300 border border-green-800/50",
  QUESTION: "bg-blue-900/40 text-blue-300 border border-blue-800/50",
};

import { feedbackSubmitterLabel } from "@/lib/feedback-display";

const TYPE_LABELS: Record<string, string> = {
  CHANGE_REQUEST: "Change Request",
  APPROVAL: "Approval ✓",
  QUESTION: "Question",
};

interface FeedbackHistoryProps {
  feedback: {
    id: string;
    type: string;
    message: string;
    status: string;
    createdAt: Date | string;
    submittedByName?: string | null;
    submittedBySessionId?: string | null;
    projectClient?: { fullName: string } | null;
    file?: { label: string | null; versionNumber: number } | null;
  }[];
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function FeedbackHistory({ feedback }: FeedbackHistoryProps) {
  if (feedback.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-4">Your feedback history</h2>
      <div className="space-y-3">
        {feedback.map((item) => (
          <div
            key={item.id}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[item.type] || "bg-neutral-800 text-neutral-300"}`}>
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                  <span className="text-xs font-medium text-neutral-400">
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
                    {getRelativeTime(new Date(item.createdAt))}
                  </span>
                  {item.status === "RESOLVED" && (
                    <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">
                      ✓ Resolved
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-300">{item.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
