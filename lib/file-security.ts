import type { FileStatus, SecurityTier } from "@prisma/client";
import { IMAGE_PREVIEW_FORMATS } from "@/lib/constants";

export type FileAccessIntent = "view" | "download";

export type FileSecurityContext = {
  mimeType?: string | null;
  format?: string | null;
  status: FileStatus;
  clientVisible: boolean;
  downloadAllowed: boolean;
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

/** Whether download is permitted for this tier + file state */
export function canDownloadFile(
  _tier: SecurityTier,
  file: FileSecurityContext
): boolean {
  if (file.downloadAllowed) return true;
  return file.status === "FINAL";
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
  intent: FileAccessIntent
): boolean {
  if (!canClientSeeFile(file)) return false;
  if (intent === "view") return true;
  return canDownloadFile(tier, file);
}

export function sanitizeFilename(label: string | null, format: string | null): string {
  const base = (label || "file").replace(/[^a-zA-Z0-9.\-_ ]/g, "_").trim() || "file";
  if (format && !base.toLowerCase().endsWith(`.${format.toLowerCase()}`)) {
    return `${base}.${format}`;
  }
  return base;
}
