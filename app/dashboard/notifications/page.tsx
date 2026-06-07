import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import MarkAllReadButton from "@/components/dashboard/MarkAllReadButton";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { sentTo: "FREELANCER", project: { userId: session.user.id } },
    include: { project: { select: { id: true, title: true } } },
    orderBy: { sentAt: "desc" },
    take: 100,
  });

  return (
    <div className="page-shell max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Local alerts — no external email required</p>
        </div>
        <MarkAllReadButton />
      </div>

      {notifications.length === 0 ? (
        <p className="text-neutral-600 text-sm">No notifications yet.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`panel-padded ${n.readAt ? "opacity-70" : ""}`}
            >
              <div className="flex justify-between gap-2">
                <p className="text-sm font-medium text-neutral-300">{n.title || n.type}</p>
                <time className="text-xs text-neutral-700 shrink-0">
                  {n.sentAt.toLocaleString()}
                </time>
              </div>
              {n.body && <p className="text-sm text-neutral-500 mt-1">{n.body}</p>}
              <Link
                href={`/dashboard/${n.project.id}`}
                className="text-xs text-neutral-600 hover:text-neutral-300 mt-2 inline-block transition-colors"
              >
                {n.project.title} →
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">← Back to home</Link>
      </p>
    </div>
  );
}
