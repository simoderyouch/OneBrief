import type { File, Project, SecurityTier } from "@prisma/client";
import { fetchFileForRecord } from "@/lib/storage";
import {
  buildPaymentGateContext,
  canAccessFile,
  canDownloadFile,
  needsProtectedPreview,
  sanitizeFilename,
  type FileAccessIntent,
} from "@/lib/file-security";
import { logFileAccess } from "@/lib/file-share";

export type { FileAccessIntent } from "@/lib/file-security";

type FileWithProject = File & {
  project: Pick<
    Project,
    | "id"
    | "securityTier"
    | "clientName"
    | "paymentGateEnabled"
    | "paymentGateMode"
    | "paymentGateMilestoneId"
  > & {
    payments: { id: string; status: string; lineKind: string }[];
  };
};

export function fileSecurityContext(file: File): {
  mimeType: string | null;
  format: string | null;
  status: File["status"];
  clientVisible: boolean;
  downloadAllowed: boolean;
  isFinalDeliverable: boolean;
} {
  return {
    mimeType: file.mimeType,
    format: file.format,
    status: file.status,
    clientVisible: file.clientVisible,
    downloadAllowed: file.downloadAllowed,
    isFinalDeliverable: file.isFinalDeliverable,
  };
}

export function getClientFileCapabilities(
  tier: SecurityTier,
  file: File,
  project?: FileWithProject["project"]
) {
  const ctx = fileSecurityContext(file);
  const gate = project
    ? buildPaymentGateContext({
        paymentGateEnabled: project.paymentGateEnabled,
        paymentGateMode: project.paymentGateMode as Parameters<
          typeof buildPaymentGateContext
        >[0]["paymentGateMode"],
        paymentGateMilestoneId: project.paymentGateMilestoneId,
        payments: project.payments.map((p) => ({
          id: p.id,
          status: p.status as "PENDING" | "PAID" | "OVERDUE" | "CANCELLED",
          lineKind: p.lineKind as "MILESTONE" | "CHANGE_ORDER",
        })),
      })
    : undefined;

  return {
    canView: canAccessFile(tier, ctx, "view", gate),
    canDownload: canDownloadFile(tier, ctx, gate),
    useProtectedPreview: needsProtectedPreview(tier, ctx),
  };
}

export async function streamFileResponse(params: {
  file: FileWithProject;
  tier: SecurityTier;
  intent: FileAccessIntent;
  headers: Headers;
  shareLinkId?: string;
  skipLog?: boolean;
  /** Freelancer owner access — bypass payment gate */
  skipGate?: boolean;
}): Promise<Response> {
  const { file, tier, intent, headers, shareLinkId, skipLog, skipGate } = params;
  const ctx = fileSecurityContext(file);
  const gate = skipGate
    ? undefined
    : buildPaymentGateContext({
    paymentGateEnabled: file.project.paymentGateEnabled,
    paymentGateMode: file.project.paymentGateMode,
    paymentGateMilestoneId: file.project.paymentGateMilestoneId,
    payments: file.project.payments.map((p) => ({
      id: p.id,
      status: p.status as "PENDING" | "PAID" | "OVERDUE" | "CANCELLED",
      lineKind: p.lineKind as "MILESTONE" | "CHANGE_ORDER",
    })),
  });

  if (!canAccessFile(tier, ctx, intent, gate)) {
    const message =
      intent === "download" && gate?.paymentGateEnabled
        ? "Download locked until required payment is recorded"
        : "Access denied";
    return Response.json({ error: message }, { status: 403 });
  }

  if (!skipLog) {
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
