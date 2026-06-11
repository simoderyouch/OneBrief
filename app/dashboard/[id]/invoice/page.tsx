import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";

interface Props {
  params: Promise<{ id: string }>;
}

function formatAmount(amount: unknown, currency: string) {
  const num = Number(amount);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(num);
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(date)
  );
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PAID: { label: "Paid", color: "text-emerald-600" },
  PENDING: { label: "Pending", color: "text-amber-600" },
  OVERDUE: { label: "Overdue", color: "text-red-600" },
  CANCELLED: { label: "Cancelled", color: "text-neutral-400" },
};

export default async function InvoicePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [project, user] = await Promise.all([
    prisma.project.findFirst({
      where: { id, userId: session.user.id },
      include: { payments: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        nickname: true,
        email: true,
        ribAccountHolder: true,
        ribIban: true,
        ribBic: true,
        ribBankName: true,
      },
    }),
  ]);

  if (!project || !user) notFound();

  const studioName = user.nickname || user.name || user.email;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${project.id.slice(-6).toUpperCase()}`;
  const invoiceDate = new Date();

  const activePayments = project.payments.filter((p) => p.status !== "CANCELLED");
  const total = activePayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paid = activePayments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const due = total - paid;

  const hasRib = user.ribIban || user.ribBic || user.ribAccountHolder;

  return (
    <div className="min-h-screen bg-neutral-950 text-white print:bg-white print:text-neutral-900">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden flex items-center justify-between px-8 py-4 border-b border-neutral-800 bg-neutral-900">
        <Link
          href={`/dashboard/${id}`}
          className="text-sm text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to project
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">{invoiceNumber}</span>
          <PrintButton />
        </div>
      </div>

      {/* Invoice body */}
      <div className="max-w-2xl mx-auto px-8 py-12 print:py-8 print:px-0">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight print:text-neutral-900">INVOICE</h1>
            <p className="text-neutral-400 print:text-neutral-500 text-sm mt-1">{invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-300 print:text-neutral-700">
              <span className="font-medium">Date:</span> {formatDate(invoiceDate)}
            </p>
            {project.deadline && (
              <p className="text-sm text-neutral-300 print:text-neutral-700 mt-1">
                <span className="font-medium">Due:</span> {formatDate(project.deadline)}
              </p>
            )}
          </div>
        </div>

        {/* From / To */}
        <div className="grid grid-cols-2 gap-8 mb-10 pb-10 border-b border-neutral-800 print:border-neutral-200">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2 print:text-neutral-400">
              From
            </p>
            <p className="font-semibold text-white print:text-neutral-900">{studioName}</p>
            <p className="text-sm text-neutral-400 print:text-neutral-600 mt-0.5">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2 print:text-neutral-400">
              To
            </p>
            <p className="font-semibold text-white print:text-neutral-900">
              {project.clientName || "Client"}
            </p>
            {project.clientEmail && (
              <p className="text-sm text-neutral-400 print:text-neutral-600 mt-0.5">
                {project.clientEmail}
              </p>
            )}
          </div>
        </div>

        {/* Project */}
        <div className="mb-8 pb-8 border-b border-neutral-800 print:border-neutral-200">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3 print:text-neutral-400">
            Project
          </p>
          <p className="font-semibold text-white print:text-neutral-900 text-lg">{project.title}</p>
          {project.serviceType && (
            <p className="text-sm text-neutral-400 print:text-neutral-500 mt-0.5">{project.serviceType}</p>
          )}
          {project.description && (
            <p className="text-sm text-neutral-500 print:text-neutral-600 mt-2">{project.description}</p>
          )}
        </div>

        {/* Payment breakdown */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4 print:text-neutral-400">
            Payment breakdown
          </p>

          {activePayments.length === 0 ? (
            <p className="text-sm text-neutral-500 italic">No payment milestones defined.</p>
          ) : (
            <div className="space-y-2">
              {activePayments.map((payment) => {
                const s = STATUS_LABELS[payment.status] ?? { label: payment.status, color: "text-neutral-400" };
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-3 border-b border-neutral-800/60 print:border-neutral-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-white print:text-neutral-900">
                        {payment.label}
                      </p>
                      {payment.description && (
                        <p className="text-xs text-neutral-500 mt-0.5">{payment.description}</p>
                      )}
                      {payment.dueDate && (
                        <p className="text-xs text-neutral-600 mt-0.5 print:text-neutral-400">
                          Due {formatDate(payment.dueDate)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white print:text-neutral-900">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                      <p className={`text-xs font-medium mt-0.5 ${s.color}`}>{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-sm text-neutral-400 print:text-neutral-600">
              <span>Subtotal</span>
              <span>{formatAmount(total, project.currency)}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between text-sm text-emerald-500">
                <span>Already paid</span>
                <span>− {formatAmount(paid, project.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-neutral-700 print:border-neutral-300 text-white print:text-neutral-900">
              <span>Balance due</span>
              <span>{formatAmount(due, project.currency)}</span>
            </div>
          </div>
        </div>

        {/* Payment instructions / RIB */}
        {hasRib && (
          <div className="mb-8 bg-neutral-900 print:bg-neutral-50 rounded-xl p-5 border border-neutral-800 print:border-neutral-200">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3 print:text-neutral-400">
              Payment instructions
            </p>
            <div className="space-y-1.5 text-sm">
              {user.ribAccountHolder && (
                <div className="flex gap-3">
                  <span className="text-neutral-500 w-32 shrink-0">Account holder</span>
                  <span className="text-white print:text-neutral-900 font-medium">{user.ribAccountHolder}</span>
                </div>
              )}
              {user.ribBankName && (
                <div className="flex gap-3">
                  <span className="text-neutral-500 w-32 shrink-0">Bank</span>
                  <span className="text-white print:text-neutral-900">{user.ribBankName}</span>
                </div>
              )}
              {user.ribIban && (
                <div className="flex gap-3">
                  <span className="text-neutral-500 w-32 shrink-0">IBAN</span>
                  <span className="text-white print:text-neutral-900 font-mono tracking-wider">
                    {user.ribIban.replace(/(.{4})/g, "$1 ").trim()}
                  </span>
                </div>
              )}
              {user.ribBic && (
                <div className="flex gap-3">
                  <span className="text-neutral-500 w-32 shrink-0">BIC / SWIFT</span>
                  <span className="text-white print:text-neutral-900 font-mono">{user.ribBic}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DocSend link */}
        {project.docsendUrl && (
          <div className="mb-8 p-4 border border-neutral-800 print:border-neutral-200 rounded-xl">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2 print:text-neutral-400">
              Download deliverables
            </p>
            <a
              href={project.docsendUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 print:text-blue-700 break-all underline"
            >
              {project.docsendUrl}
            </a>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-neutral-600 print:text-neutral-400 text-center mt-12">
          {studioName} · {user.email}
        </p>
      </div>
    </div>
  );
}
