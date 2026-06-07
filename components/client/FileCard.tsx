import {
  buildClientPortalPreviewPath,
  clientPortalApiBase,
} from "@/lib/client-portal-url";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileCardProps {
  portalSlug: string;
  portalToken: string;
  file: {
    id: string;
    label: string | null;
    format: string | null;
    sizeBytes: number | null;
    versionNumber: number;
    status: string;
    note: string | null;
    uploadedAt: Date;
  };
  canDownload: boolean;
  useProtectedPreview: boolean;
}

export default function FileCard({
  portalSlug,
  portalToken,
  file,
  canDownload,
  useProtectedPreview,
}: FileCardProps) {
  const isNew =
    file.versionNumber > 1 ||
    new Date(file.uploadedAt).getTime() > Date.now() - 86400 * 1000 * 3;

  const viewHref = useProtectedPreview
    ? buildClientPortalPreviewPath(portalSlug, portalToken, file.id)
    : `${clientPortalApiBase(portalSlug, portalToken)}/files/${file.id}?intent=view`;

  const downloadHref = `${clientPortalApiBase(portalSlug, portalToken)}/files/${file.id}?intent=download`;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-start gap-4">
      <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-white text-sm truncate">{file.label || "File"}</span>
          <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
            v{file.versionNumber}
          </span>
          {isNew && (
            <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800/50 px-2 py-0.5 rounded-full">
              New
            </span>
          )}
          {file.status === "FINAL" && (
            <span className="text-xs bg-green-900/50 text-green-300 border border-green-800/50 px-2 py-0.5 rounded-full">
              Final
            </span>
          )}
          {useProtectedPreview && (
            <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded-full">
              Protected preview
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
          {file.format && <span>.{file.format.toUpperCase()}</span>}
          {file.sizeBytes && <span>{formatBytes(file.sizeBytes)}</span>}
          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
        </div>

        {file.note && (
          <p className="mt-2 text-sm text-neutral-400 bg-neutral-800/50 rounded-lg px-3 py-2">
            {file.note}
          </p>
        )}
      </div>

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
      </div>
    </div>
  );
}
