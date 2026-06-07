type FreelancerBadgeProps = {
  name: string;
  avatarUrl?: string | null;
};

/** Compact host strip — avatar, label, name, one short line. */
export default function FreelancerBadge({ name, avatarUrl }: FreelancerBadgeProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2.5">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/10"
        />
      ) : (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold text-white ring-1 ring-white/10"
          aria-hidden
        >
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500 leading-none mb-0.5">Host</p>
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-neutral-500 truncate mt-0.5">{name}&apos;s client page</p>
      </div>
    </div>
  );
}
