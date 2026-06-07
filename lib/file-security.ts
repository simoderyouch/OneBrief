import type { FileStatus, SecurityTier } from "@prisma/client";
import { IMAGE_PREVIEW_FORMATS } from "@/lib/constants";
import {
  canDownloadWithPaymentGate,
  type PaymentGateContext,
} from "@/lib/payment-gate";

export type FileAccessIntent = "view" | "download";

export type FileSecurityContext = {
  mimeType?: string | null;
  format?: string | null;
  status: FileStatus;
  clientVisible: boolean;
  downloadAllowed: boolean;
  isFinalDeliverable?: boolean;
};

export const SECURITY_TIER_LABELS: Record<
  SecurityTier,
  { label: string; description: string }
> = {
  BASIC: {
    label: "Basic",
    description: "Secure link, revoke & expiry. Files served through the app — no raw URLs exposed.",
  },
  STANDARD: {
    label: "Standard",
    description: "Basic + per-file download control and full view/download audit log.",
  },
  PROTECTED: {
    label: "Protected",
    description: "Standard + watermarked low-res previews for work-in-progress images.",
  },
};

export function isPreviewableImage(file: {
  mimeType?: string | null;
  format?: string | null;
}): boolean {
  if (file.mimeType?.startsWith("image/")) return true;
  return IMAGE_PREVIEW_FORMATS.has((file.format || "").toLowerCase());
}

/** Client portal: file row visible */
export function canClientSeeFile(file: FileSecurityContext): boolean {
  return file.clientVisible && file.status !== "SUPERSEDED";
}

/** Whether download is permitted for this tier + file state (before payment gate) */
export function canDownloadFileBase(
  _tier: SecurityTier,
  file: FileSecurityContext
): boolean {
  if (file.downloadAllowed) return true;
  return file.status === "FINAL";
}

/** Whether download is permitted including optional payment gate */
export function canDownloadFile(
  tier: SecurityTier,
  file: FileSecurityContext,
  gate?: PaymentGateContext
): boolean {
  const base = canDownloadFileBase(tier, file);
  if (!gate) return base;
  return canDownloadWithPaymentGate({
    gate,
    file: {
      downloadAllowed: file.downloadAllowed,
      status: file.status,
      isFinalDeliverable: file.isFinalDeliverable ?? false,
    },
    baseCanDownload: base,
  });
}

/** PROTECTED tier: non-final images use watermarked preview page */
export function needsProtectedPreview(
  tier: SecurityTier,
  file: FileSecurityContext
): boolean {
  if (tier !== "PROTECTED") return false;
  if (file.status === "FINAL") return false;
  return isPreviewableImage(file);
}

export function canAccessFile(
  tier: SecurityTier,
  file: FileSecurityContext,
  intent: FileAccessIntent,
  gate?: PaymentGateContext
): boolean {
  if (!canClientSeeFile(file)) return false;
  if (intent === "view") return true;
  return canDownloadFile(tier, file, gate);
}

export function sanitizeFilename(label: string | null, format: string | null): string {
  const base = (label || "file").replace(/[^a-zA-Z0-9.\-_ ]/g, "_").trim() || "file";
  if (format && !base.toLowerCase().endsWith(`.${format.toLowerCase()}`)) {
    return `${base}.${format}`;
  }
  return base;
}

export function buildPaymentGateContext(project: {
  paymentGateEnabled: boolean;
  paymentGateMode: PaymentGateContext["paymentGateMode"];
  paymentGateMilestoneId: string | null;
  payments: PaymentGateContext["payments"];
}): PaymentGateContext {
  return {
    paymentGateEnabled: project.paymentGateEnabled,
    paymentGateMode: project.paymentGateMode,
    paymentGateMilestoneId: project.paymentGateMilestoneId,
    payments: project.payments,
  };
}
