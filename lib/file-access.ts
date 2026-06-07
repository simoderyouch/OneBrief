import type { File, Project, SecurityTier } from "@prisma/client";
import { fetchFileForRecord } from "@/lib/supabase";
import {
  canAccessFile,
  canDownloadFile,
  needsProtectedPreview,
  sanitizeFilename,
  type FileAccessIntent,
} from "@/lib/file-security";
import { logFileAccess } from "@/lib/file-share";

export type { FileAccessIntent } from "@/lib/file-security";

type FileWithProject = File & {
  project: Pick<Project, "id" | "securityTier" | "clientName">;
};

export function fileSecurityContext(file: File): {
  mimeType: string | null;
  format: string | null;
  status: File["status"];
  clientVisible: boolean;
  downloadAllowed: boolean;
} {
  return {
    mimeType: file.mimeType,
    format: file.format,
    status: file.status,
    clientVisible: file.clientVisible,
    downloadAllowed: file.downloadAllowed,
  };
}

export function getClientFileCapabilities(
  tier: SecurityTier,
  file: File
) {
  const ctx = fileSecurityContext(file);
  return {
    canView: canAccessFile(tier, ctx, "view"),
    canDownload: canDownloadFile(tier, ctx),
    useProtectedPreview: needsProtectedPreview(tier, ctx),
  };
}

export async function streamFileResponse(params: {
  file: FileWithProject;
  tier: SecurityTier;
  intent: FileAccessIntent;
  headers: Headers;
  shareLinkId?: string;
  /** When true, skip audit log (e.g. freelancer owner access) */
  skipLog?: boolean;
}): Promise<Response> {
  const { file, tier, intent, headers, shareLinkId, skipLog } = params;
  const ctx = fileSecurityContext(file);

  if (!canAccessFile(tier, ctx, intent)) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  if (!skipLog && tier !== "BASIC") {
    await logFileAccess({
      fileId: file.id,
      projectId: file.projectId,
      eventType: intent === "download" ? "DOWNLOAD" : "VIEW",
      headers,
      shareLinkId,
    });
  }

  const { data, contentType } = await fetchFileForRecord(file);
  const filename = sanitizeFilename(file.label, file.format);

  const disposition =
    intent === "download"
      ? `attachment; filename="${filename.replace(/"/g, "")}"`
      : `inline; filename="${filename.replace(/"/g, "")}"`;

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "Content-Length": String(data.length),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Strip storage URLs from file objects sent to the browser */
export function serializeFileForClient<T extends File>(file: T) {
  const { cloudinaryUrl: _u, publicId: _p, ...safe } = file;
  return safe;
}
