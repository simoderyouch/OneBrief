import Link from "next/link";
import OnebriefLogo from "./OnebriefLogo";

type Reason = "RATE_LIMIT" | "REVOKED" | "EXPIRED" | "INACTIVE" | "MAX_VIEWS";

const copy: Record<Reason, { title: string; body: string }> = {
  RATE_LIMIT: {
    title: "Too many requests",
    body: "This link has received too many visits. Please wait about an hour and try again.",
  },
  REVOKED: {
    title: "Link no longer valid",
    body: "The designer has revoked access to this page. Contact them for a new link.",
  },
  EXPIRED: {
    title: "Link expired",
    body: "This client link has expired. Ask your designer to send an updated link.",
  },
  INACTIVE: {
    title: "Link disabled",
    body: "This project link is not active. Contact your designer if you need access.",
  },
  MAX_VIEWS: {
    title: "View limit reached",
    body: "This share link has reached its maximum number of views. Ask your designer for a new link.",
  },
};

export default function PublicAccessDenied({ reason }: { reason: Reason }) {
  const { title, body } = copy[reason];
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <OnebriefLogo />
      </div>
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
        <h1 className="text-xl font-semibold text-white mb-2">{title}</h1>
        <p className="text-neutral-400 text-sm mb-6">{body}</p>
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
          ← Home
        </Link>
      </div>
    </div>
  );
}
