"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-neutral-800 text-neutral-300",
  IN_PROGRESS: "bg-blue-900/50 text-blue-300",
  WAITING_FEEDBACK: "bg-amber-900/50 text-amber-300",
  IN_REVISION: "bg-orange-900/50 text-orange-300",
  DELIVERED: "bg-green-900/50 text-green-300",
  ARCHIVED: "bg-neutral-800 text-neutral-400",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  WAITING_FEEDBACK: "Waiting Feedback",
  IN_REVISION: "In Revision",
  DELIVERED: "Delivered",
  ARCHIVED: "Archived",
};

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    clientName: string | null;
    status: string;
    stage: string;
    deadline: Date | null;
    totalPrice: any;
    currency: string;
    feedback: any[];
    payments: any[];
    files: any[];
    updatedAt: Date;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const totalPaid = project.payments
    .filter((p: any) => p.status === "PAID")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const deadlinePassed = project.deadline && new Date(project.deadline) < new Date();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmDelete(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <Link href={`/dashboard/${project.id}`} className="block">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-600 transition-all hover:bg-neutral-800/50 group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate group-hover:text-white">{project.title}</h3>
              {project.clientName && (
                <p className="text-sm text-neutral-400 mt-0.5">{project.clientName}</p>
              )}
            </div>
            <span className={`ml-3 shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status] || "bg-neutral-800 text-neutral-400"}`}>
              {STATUS_LABELS[project.status] || project.status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-500">
            {project.deadline && (
              <span className={deadlinePassed ? "text-red-400" : ""}>
                📅 {new Date(project.deadline).toLocaleDateString()}
              </span>
            )}
            {project.feedback.length > 0 && (
              <span className="text-amber-400">
                💬 {project.feedback.length} open
              </span>
            )}
            {project.totalPrice && (
              <span>
                {totalPaid > 0 ? `${totalPaid.toLocaleString()} / ` : ""}
                {Number(project.totalPrice).toLocaleString()} {project.currency}
              </span>
            )}
          </div>

          <div className="mt-3 text-xs text-neutral-600">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </Link>

      {/* Delete button — outside the Link to avoid event bubbling */}
      <div className="absolute top-3 right-3 z-10">
        {confirmDelete ? (
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded-lg p-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs px-2 py-1 bg-red-900/60 hover:bg-red-900 text-red-300 rounded transition-colors disabled:opacity-50"
            >
              {deleting ? "…" : "Delete"}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(false); }}
              className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-500 hover:text-red-400 rounded-lg transition-all"
            title="Delete project"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
