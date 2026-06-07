/**
 * Local notification delivery — no external email provider.
 * Notifications are stored in the database and logged to console.
 */
export interface LocalNotificationPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendLocalNotification(payload: LocalNotificationPayload): Promise<void> {
  const preview = payload.subject;
  console.info(
    `[OneBrief notification] To: ${payload.to} | ${preview}`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function feedbackReceivedEmail(
  freelancerName: string,
  projectTitle: string,
  feedbackType: string,
  feedbackMessage: string,
  projectUrl: string,
  submitterName?: string | null
) {
  const fromLine =
    submitterName?.trim()
      ? `From (client): ${submitterName.trim()}`
      : "";
  return {
    subject: `New feedback: ${projectTitle}`,
    html: `Hi ${freelancerName}, new ${feedbackType} on ${projectTitle}. ${fromLine} ${feedbackMessage} View: ${projectUrl}`,
    textBody: `${feedbackType}: ${feedbackMessage}`,
  };
}

export function newVersionEmail(
  clientName: string,
  projectTitle: string,
  versionNumber: number,
  freelancerNote: string,
  projectUrl?: string
) {
  return {
    subject: `New version: ${projectTitle} (v${versionNumber})`,
    html: `Hi ${clientName}, version ${versionNumber} of ${projectTitle} is ready.${freelancerNote ? ` Note: ${freelancerNote}` : ""}${projectUrl ? ` ${projectUrl}` : ""}`,
    textBody: `Version ${versionNumber} ready for review.`,
  };
}

export function projectStatusChangedEmail(
  clientName: string,
  projectTitle: string,
  statusLabel: string,
  projectUrl?: string
) {
  return {
    subject: `Project update: ${projectTitle}`,
    html: `Hi ${clientName || "there"}, ${projectTitle} is now ${statusLabel}.${projectUrl ? ` ${projectUrl}` : ""}`,
    textBody: `${projectTitle} → ${statusLabel}`,
  };
}

export function approvalReceivedEmail(
  freelancerName: string,
  projectTitle: string,
  fileLabel: string,
  projectUrl: string
) {
  return {
    subject: `Approved: ${fileLabel} — ${projectTitle}`,
    html: `Hi ${freelancerName}, client approved ${escapeHtml(fileLabel)} on ${escapeHtml(projectTitle)}. ${projectUrl}`,
    textBody: `Client approved ${fileLabel}`,
  };
}

export function milestonePaidEmail(
  clientName: string,
  projectTitle: string,
  milestoneLabel: string,
  projectUrl?: string
) {
  return {
    subject: `Payment recorded: ${milestoneLabel}`,
    html: `Hi ${clientName}, we recorded payment for "${milestoneLabel}" on ${projectTitle}.${projectUrl ? ` ${projectUrl}` : ""}`,
    textBody: `Payment recorded for ${milestoneLabel}`,
  };
}

/** @deprecated use sendLocalNotification — kept for notify.ts compatibility */
export async function sendEmail(payload: LocalNotificationPayload): Promise<{ id: string }> {
  await sendLocalNotification(payload);
  return { id: `local-${Date.now()}` };
}
