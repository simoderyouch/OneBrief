/**
 * Label for who submitted feedback or a work request (display name, session tail, or generic).
 */
export function feedbackSubmitterLabel(
  submittedByName: string | null | undefined,
  submittedBySessionId: string | null | undefined,
  projectClient?: { fullName: string } | null
): string {
  const fromPortal = projectClient?.fullName?.trim();
  if (fromPortal) return fromPortal;
  const name = submittedByName?.trim();
  if (name && name.length > 0) return name;
  const tail = submittedBySessionId?.replace(/-/g, "").slice(-4);
  if (tail) return `Guest · ${tail}`;
  return "Client";
}
