"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SecurityTier } from "@prisma/client";
import FileSecurityControls from "@/components/dashboard/FileSecurityControls";

interface FileListProps {
  files: {
    id: string;
    label: string | null;
    format: string | null;
    sizeBytes: number | null;
    versionNumber: number;
    status: string;
    note: string | null;
    uploadedAt: Date | string;
    clientVisible: boolean;
    downloadAllowed: boolean;
  }[];
  projectId: string;
  securityTier: SecurityTier;
}

const STATUS_STYLES: Record<string, string> = {
  CURRENT: "bg-blue-900/40 text-blue-300",
  FINAL: "bg-green-900/40 text-green-300",
  SUPERSEDED: "bg-neutral-800 text-neutral-500",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileList({ files, projectId, securityTier }: FileListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (fileId: string) => {
      setDeleting(fileId);
      await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      setDeleting(null);
      setConfirmId(null);
      router.refresh();
    },
    [router]
  );

  if (files.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-4">No files uploaded yet.</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 py-2.5 border-t border-neutral-800 first:border-t-0"
        >
          <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{file.label || "File"}</p>
            <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
              <span>v{file.versionNumber}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${STATUS_STYLES[file.status] || "bg-neutral-800 text-neutral-500"}`}
              >
                {file.status}
              </span>
              {!file.clientVisible && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-neutral-800 text-neutral-500">
                  Hidden
                </span>
              )}
              {file.downloadAllowed && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-neutral-800 text-neutral-500">
                  DL on
                </span>
              )}
              {file.format && <span>.{file.format.toUpperCase()}</span>}
              {file.sizeBytes && <span>{formatBytes(file.sizeBytes)}</span>}
            </div>
            {file.note && <p className="text-xs text-neutral-500 mt-0.5 truncate">{file.note}</p>}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href={`/api/files/${file.id}/access?intent=view`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-white transition-colors px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded"
            >
              View
            </a>

            <FileSecurityControls file={file} securityTier={securityTier} />

            {confirmId === file.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(file.id)}
                  disabled={deleting === file.id}
                  className="text-xs px-2 py-1 bg-red-900/60 hover:bg-red-900 text-red-300 rounded transition-colors disabled:opacity-50"
                >
                  {deleting === file.id ? "…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(file.id)}
                className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 rounded transition-colors"
                title="Delete file"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
