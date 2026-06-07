"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildClientPortalUrl } from "@/lib/client-portal-url";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "LEAD", label: "Lead / Quote" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_FEEDBACK", label: "Waiting Feedback" },
  { value: "APPROVAL_PENDING", label: "Approval Pending" },
  { value: "IN_REVISION", label: "In Revision" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ARCHIVED", label: "Archived" },
];

const STAGE_OPTIONS = [
  { value: "BRIEF", label: "Brief" },
  { value: "CONCEPTS", label: "Concepts" },
  { value: "REFINEMENT", label: "Refinement" },
  { value: "FINALS", label: "Finals" },
  { value: "DELIVERY", label: "Delivery" },
];

interface ProjectDetailActionsProps {
  project: {
    id: string;
    title: string;
    clientName: string | null;
    token: string;
    tokenActive: boolean;
    tokenRevokedAt: Date | string | null;
    tokenExpiresAt: Date | string | null;
    status: string;
    stage: string;
  };
}

export default function ProjectDetailActions({ project }: ProjectDetailActionsProps) {
  const router = useRouter();
  const [copying, setCopying] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [newClientUrl, setNewClientUrl] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const isActive =
    project.tokenActive &&
    !project.tokenRevokedAt &&
    (!project.tokenExpiresAt || new Date(project.tokenExpiresAt) > new Date());

  async function handleStatusChange(status: string) {
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function handleStageChange(stage: string) {
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    router.refresh();
  }

  async function copyClientLink() {
    setCopying(true);
    const url = buildClientPortalUrl(window.location.origin, {
      title: project.title,
      clientName: project.clientName,
      token: project.token,
    });
    await navigator.clipboard.writeText(url);
    setTimeout(() => setCopying(false), 2000);
  }

  async function revokeLink() {
    setRevoking(true);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenActive: false }),
    });
    setRevoking(false);
    router.refresh();
  }

  async function regenerateLink() {
    setRegenerating(true);
    setNewClientUrl(null);
    const res = await fetch(`/api/projects/${project.id}/regenerate-token`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.clientUrl) {
      setNewClientUrl(data.clientUrl);
    }
    setRegenerating(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        defaultValue={project.stage}
        onChange={(e) => handleStageChange(e.target.value)}
        className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
      >
        {STAGE_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        defaultValue={project.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {isActive ? (
        <>
          <button
            onClick={copyClientLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-neutral-300 text-sm font-medium transition-colors"
          >
            {copying ? (
              <>
                <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy link
              </>
            )}
          </button>

          <button
            onClick={revokeLink}
            disabled={revoking}
            className="px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/50 rounded-lg text-neutral-400 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {revoking ? "…" : "Revoke"}
          </button>
        </>
      ) : (
        <>
          <span className="text-xs px-2 py-1 bg-neutral-800 text-neutral-500 rounded-lg">
            Link disabled
          </span>
          <button
            onClick={regenerateLink}
            disabled={regenerating}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-neutral-300 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {regenerating ? "Generating…" : "Regenerate link"}
          </button>
        </>
      )}

      {/* New URL toast */}
      {newClientUrl && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 shadow-xl max-w-sm w-full mx-4">
          <p className="text-xs font-medium text-white mb-1">New client link generated!</p>
          <p className="text-xs text-neutral-400 break-all mb-3">{newClientUrl}</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(newClientUrl);
              }}
              className="flex-1 py-1.5 bg-white text-neutral-900 rounded-lg text-xs font-semibold hover:bg-neutral-100"
            >
              Copy URL
            </button>
            <button
              onClick={() => setNewClientUrl(null)}
              className="px-3 py-1.5 bg-neutral-700 text-neutral-300 rounded-lg text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
