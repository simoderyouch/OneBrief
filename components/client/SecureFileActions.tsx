"use client";

interface SecureFileActionsProps {
  /** Project portal token or file share token */
  token: string;
  fileId: string;
  label: string | null;
  canDownload: boolean;
  useProtectedPreview: boolean;
  /** `project` = `/p/...` portal · `share` = `/s/...` standalone link */
  context: "project" | "share";
}

export default function SecureFileActions({
  token,
  fileId,
  label,
  canDownload,
  useProtectedPreview,
  context,
}: SecureFileActionsProps) {
  const viewHref =
    useProtectedPreview
      ? context === "project"
        ? `/p/${token}/preview/${fileId}`
        : `/s/${token}/preview`
      : context === "project"
        ? `/api/client/${token}/files/${fileId}?intent=view`
        : `/api/s/${token}/access?intent=view`;

  const downloadHref =
    context === "project"
      ? `/api/client/${token}/files/${fileId}?intent=download`
      : `/api/s/${token}/access?intent=download`;

  return (
    <div className="flex items-center gap-2 shrink-0">
      <a
        href={viewHref}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
      >
        {useProtectedPreview ? "Preview" : "View"}
      </a>
      {canDownload && (
        <a
          href={downloadHref}
          className="shrink-0 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
        >
          Download
        </a>
      )}
      {!canDownload && (
        <span
          className="text-xs text-neutral-600 px-2"
          title={`${label || "File"} — view only until marked final or download is enabled`}
        >
          View only
        </span>
      )}
    </div>
  );
}
