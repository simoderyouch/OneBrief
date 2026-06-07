export type WhatsAppTemplate =
  | "portal_link"
  | "new_version"
  | "review_ready"
  | "payment_recorded"
  | "approval_needed";

export const WHATSAPP_TEMPLATE_LABELS: Record<WhatsAppTemplate, string> = {
  portal_link: "Share portal link",
  new_version: "New version ready",
  review_ready: "Ready for your review",
  payment_recorded: "Payment recorded — finals unlocked",
  approval_needed: "Waiting for your approval",
};

/** Strip to digits; return null if too short */
export function normalizeWhatsAppPhone(
  input: string,
  defaultCountryCode = "212"
): string | null {
  let digits = input.replace(/\D/g, "");
  if (!digits) return null;

  // Local number starting with 0 (e.g. 0612345678 → 212612345678)
  if (digits.startsWith("0") && defaultCountryCode) {
    digits = defaultCountryCode + digits.slice(1);
  }

  // Bare local without country (9 digits for MA mobile)
  if (
    defaultCountryCode &&
    digits.length >= 9 &&
    digits.length <= 10 &&
    !digits.startsWith(defaultCountryCode)
  ) {
    digits = defaultCountryCode + digits.replace(/^0/, "");
  }

  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function buildWhatsAppUrl(phoneDigits: string, message: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppMessage(params: {
  template: WhatsAppTemplate;
  clientName: string;
  projectTitle: string;
  portalUrl: string;
  studioName: string;
  extraNote?: string;
}): string {
  const name = params.clientName.trim() || "there";
  const studio = params.studioName.trim() || "Your designer";
  const link = params.portalUrl;

  switch (params.template) {
    case "new_version":
      return `Hi ${name}, a new version of *${params.projectTitle}* is ready for review.\n\nOpen your private portal:\n${link}\n\n— ${studio}`;
    case "review_ready":
      return `Hi ${name}, deliverables for *${params.projectTitle}* are ready for your feedback.\n\nReview here:\n${link}\n\n— ${studio}`;
    case "payment_recorded":
      return `Hi ${name}, thank you — we recorded your payment for *${params.projectTitle}*.\n\nYour updated portal:\n${link}\n\n— ${studio}`;
    case "approval_needed":
      return `Hi ${name}, we're waiting for your approval on *${params.projectTitle}*.\n\nPlease review and approve here:\n${link}\n\n— ${studio}`;
    case "portal_link":
    default:
      return `Hi ${name}, here is your private project portal for *${params.projectTitle}*:\n\n${link}\n\nView deliverables, leave feedback, and track progress there.\n\n— ${studio}`;
  }
}

import type { ClientPortalLinkProject } from "@/lib/client-portal-url";
import { buildClientPortalUrl } from "@/lib/client-portal-url";

export function buildPortalUrl(baseUrl: string, project: ClientPortalLinkProject): string {
  return buildClientPortalUrl(baseUrl, project);
}
