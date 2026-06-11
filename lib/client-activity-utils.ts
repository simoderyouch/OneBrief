export type ClientActivityItem = {
  id: string;
  at: Date;
  kind: "portal_visit" | "file_view" | "file_download" | "feedback" | "work_request" | "work_message";
  label: string;
};

export type ProjectClientActivity = {
  portalViews: number;
  fileViews: number;
  fileDownloads: number;
  lastSeenAt: Date | null;
  recent: ClientActivityItem[];
};

export type ProjectViewSummary = {
  projectId: string;
  portalViews: number;
  fileViews: number;
  lastSeenAt: Date | null;
};

export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}
