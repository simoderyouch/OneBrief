import { auth } from "@/lib/auth";
import { getClientSummaries } from "@/lib/clients";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientNotesForm from "@/components/dashboard/ClientNotesForm";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const clients = await getClientSummaries(session.user.id);

  return (
    <div className="page-shell">
      <h1 className="page-title mb-2">Clients</h1>
      <p className="page-subtitle mb-8">All clients across your projects</p>

      {clients.length === 0 ? (
        <p className="text-neutral-600 text-sm">No clients yet — add client email when creating a project.</p>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <div key={c.clientEmail} className="panel-padded">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium text-neutral-200">{c.clientName || c.clientEmail}</h2>
                  <p className="text-sm text-neutral-600">{c.clientEmail}</p>
                </div>
                <div className="text-right text-sm space-y-0.5">
                  <p className="text-money">{c.totalPaid.toLocaleString()} paid</p>
                  <p className="text-money-muted">{c.outstanding.toLocaleString()} outstanding</p>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-neutral-500">
                <span>{c.projectCount} project{c.projectCount !== 1 ? "s" : ""}</span>
                <span>{c.activeProjects} active</span>
                {c.lastActivity && (
                  <span>Last activity {c.lastActivity.toLocaleDateString()}</span>
                )}
              </div>
              <ClientNotesForm
                clientEmail={c.clientEmail}
                clientName={c.clientName}
                initialNotes={c.notes}
              />
            </div>
          ))}
        </div>
      )}

      <p className="mt-8">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">← Back to home</Link>
      </p>
    </div>
  );
}
