import { Eye, Download, MessageCircle, FolderOpen, MessagesSquare } from "lucide-react";
import type { ClientActivityItem, ProjectClientActivity } from "@/lib/client-activity-utils";
import { formatRelativeTime } from "@/lib/client-activity-utils";

function activityIcon(kind: ClientActivityItem["kind"]) {
  switch (kind) {
    case "portal_visit":
      return FolderOpen;
    case "file_view":
      return Eye;
    case "file_download":
      return Download;
    case "feedback":
      return MessageCircle;
    case "work_request":
    case "work_message":
      return MessagesSquare;
    default:
      return Eye;
  }
}

export default function ClientActivityPanel({ activity }: { activity: ProjectClientActivity }) {
  const totalViews = activity.portalViews + activity.fileViews;

  return (
    <div className="panel-padded space-y-4">
      <div>
        <h3 className="text-sm font-medium text-neutral-300">Client activity</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          {activity.lastSeenAt
            ? `Last seen ${formatRelativeTime(activity.lastSeenAt)}`
            : "Client has not opened the portal yet"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3 text-center">
          <p className="text-lg font-semibold tabular-nums text-neutral-100">{activity.portalViews}</p>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 mt-0.5">Portal views</p>
        </div>
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3 text-center">
          <p className="text-lg font-semibold tabular-nums text-neutral-100">{activity.fileViews}</p>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 mt-0.5">File views</p>
        </div>
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3 text-center">
          <p className="text-lg font-semibold tabular-nums text-neutral-100">{activity.fileDownloads}</p>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 mt-0.5">Downloads</p>
        </div>
      </div>

      <p className="text-xs text-neutral-600">
        {totalViews} total view{totalViews !== 1 ? "s" : ""} recorded
      </p>

      {activity.recent.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2">Recent activity</p>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {activity.recent.map((item) => {
              const Icon = activityIcon(item.kind);
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 text-sm py-1.5 border-b border-neutral-800/50 last:border-0"
                >
                  <Icon className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-neutral-300 truncate">{item.label}</p>
                    <p className="text-[11px] text-neutral-600">{formatRelativeTime(item.at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-neutral-600">No client activity yet. Share the portal link to start tracking.</p>
      )}
    </div>
  );
}
