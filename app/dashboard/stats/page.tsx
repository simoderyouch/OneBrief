import { auth } from "@/lib/auth";
import { getBusinessStats, getProtectionReport } from "@/lib/stats";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [business, protection] = await Promise.all([
    getBusinessStats(session.user.id),
    getProtectionReport(session.user.id),
  ]);

  return (
    <div className="page-shell">
      <h1 className="page-title mb-2">Business stats</h1>
      <p className="page-subtitle mb-8">Track revenue and project health</p>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <div className="stat-card">
          <p className="stat-label">Total projects</p>
          <p className="stat-value">{business.totalProjects}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Completed</p>
          <p className="stat-value-soft">{business.completedProjects}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg files / project</p>
          <p className="stat-value">{business.avgFilesPerProject}</p>
        </div>
      </div>

      <section className="panel-padded mb-4">
        <h2 className="text-sm font-medium text-neutral-300 mb-4">Revenue by month</h2>
        {Object.keys(business.revenueByMonth).length === 0 ? (
          <p className="text-sm text-neutral-600">No paid milestones recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(business.revenueByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, amount]) => (
                <li key={month} className="flex justify-between text-sm">
                  <span className="text-neutral-500">{month}</span>
                  <span className="text-money">{amount.toLocaleString()}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="panel-padded mb-4">
        <h2 className="text-sm font-medium text-neutral-300 mb-4">Projects by status</h2>
        <ul className="space-y-2">
          {Object.entries(business.byStatus).map(([status, count]) => (
            <li key={status} className="flex justify-between text-sm">
              <span className="text-neutral-500">{status.replace(/_/g, " ")}</span>
              <span className="text-neutral-300 tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-padded">
        <h2 className="text-sm font-medium text-neutral-300 mb-2">Protection report</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Final deliverables downloaded while milestones unpaid: {protection.downloadsBeforePayment}
        </p>
        {protection.riskyFiles.length > 0 && (
          <ul className="text-sm text-neutral-500 space-y-1">
            {protection.riskyFiles.map((f) => (
              <li key={f.id}>
                {f.label} — {f.projectTitle}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">← Back to home</Link>
      </p>
    </div>
  );
}
