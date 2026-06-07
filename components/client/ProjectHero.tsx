import OnebriefLogo from "./OnebriefLogo";
import FreelancerBadge from "./FreelancerBadge";

interface ProjectHeroProps {
  project: {
    title: string;
    clientName: string | null;
    status: string;
    serviceType: string | null;
    deadline: Date | null;
    updatedAt: Date;
  };
  /** When set (portal session), shown instead of `project.clientName` in the welcome line. */
  welcomeName?: string | null;
  freelancerName: string;
  freelancerAvatarUrl?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  WAITING_FEEDBACK: "Waiting Feedback",
  IN_REVISION: "In Revision",
  DELIVERED: "Delivered",
  ARCHIVED: "Archived",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-neutral-800/90 text-neutral-300 ring-1 ring-white/5",
  IN_PROGRESS: "bg-sky-950/80 text-sky-200 ring-1 ring-sky-500/20",
  WAITING_FEEDBACK: "bg-amber-950/60 text-amber-200 ring-1 ring-amber-500/25",
  IN_REVISION: "bg-orange-950/60 text-orange-200 ring-1 ring-orange-500/25",
  DELIVERED: "bg-emerald-950/70 text-emerald-200 ring-1 ring-emerald-500/25",
  ARCHIVED: "bg-neutral-800/90 text-neutral-400 ring-1 ring-white/5",
};

export default function ProjectHero({
  project,
  welcomeName,
  freelancerName,
  freelancerAvatarUrl,
}: ProjectHeroProps) {
  const updatedAgo = getRelativeTime(new Date(project.updatedAt));

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <OnebriefLogo size="lg" />
          <span className="text-[10px] text-neutral-500 shrink-0">Private link</span>
        </div>
      </header>

      <div className="border-b border-neutral-800/80 bg-neutral-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <p className="text-sm leading-relaxed text-neutral-400">
            {welcomeName?.trim() ? (
              <>
                <span className="text-neutral-100 font-medium">Welcome, {welcomeName.trim()}.</span>{" "}
              </>
            ) : project.clientName ? (
              <>
                <span className="text-neutral-100 font-medium">Welcome, {project.clientName}.</span>{" "}
              </>
            ) : (
              <span className="text-neutral-100 font-medium">Welcome.</span>
            )}
            <span className="text-neutral-500">Updated {updatedAgo}.</span>
          </p>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="min-w-0 flex-1 space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-semibold tracking-tight text-white text-balance leading-[1.15]">
                {project.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                {project.serviceType && (
                  <span className="inline-flex rounded-lg bg-white/[0.05] px-2.5 py-1 text-sm text-neutral-300 ring-1 ring-white/[0.06]">
                    {project.serviceType}
                  </span>
                )}
                {project.deadline && (
                  <span className="text-sm text-neutral-500">
                    Due{" "}
                    {new Date(project.deadline).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                )}
              </div>
            </div>

            <span
              className={`shrink-0 self-start rounded-full px-3 py-1 text-[11px] font-medium ${STATUS_COLORS[project.status] || "bg-neutral-800/90 text-neutral-300 ring-1 ring-white/5"}`}
            >
              {STATUS_LABELS[project.status] || project.status}
            </span>
          </div>

          <FreelancerBadge name={freelancerName} avatarUrl={freelancerAvatarUrl} />
        </div>
      </div>
    </>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}
