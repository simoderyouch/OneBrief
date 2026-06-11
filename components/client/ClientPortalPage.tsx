import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolvePublicPortal } from "@/lib/public-project";
import { refreshPaymentOverdue } from "@/lib/payments";
import { decimalToNumber } from "@/lib/serialize";
import ProjectHero from "@/components/client/ProjectHero";
import ProgressStages from "@/components/client/ProgressStages";
import FileCard from "@/components/client/FileCard";
import FeedbackForm from "@/components/client/FeedbackForm";
import FeedbackHistory from "@/components/client/FeedbackHistory";
import PaymentSummary from "@/components/client/PaymentSummary";
import ClientWorkRequests from "@/components/client/ClientWorkRequests";
import PublicAccessDenied from "@/components/client/PublicAccessDenied";
import PublicPageRefresh from "@/components/client/PublicPageRefresh";
import {
  getClientFileCapabilities,
  serializeFileForClient,
  fileSecurityContext,
} from "@/lib/file-access";
import { canClientSeeFile } from "@/lib/file-security";
import { isPaymentGateSatisfied } from "@/lib/payment-gate";

export default async function ClientPortalPage({
  slug,
  token,
}: {
  slug: string;
  token: string;
}) {
  const h = await headers();
  const result = await resolvePublicPortal(slug, token, h, {
    logAccess: true,
  });

  if (!result.ok) {
    if (result.error === "NOT_FOUND") notFound();
    return <PublicAccessDenied reason={result.error} />;
  }

  const { project } = result;

  await refreshPaymentOverdue(project.id);
  const [payments, deliveryLinks] = await Promise.all([

    prisma.payment.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.deliveryLink.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Show payment block if there's a total price OR milestones, except at very first stages.
  const HIDE_STAGES = ["BRIEF", "CONCEPTS"];
  const FORCE_SHOW_STATUSES = ["IN_REVISION", "WAITING_FEEDBACK", "DELIVERED", "COMPLETED", "APPROVAL_PENDING"];
  const hasPaymentData = payments.length > 0 || !!project.totalPrice;
  const showPayments =
    hasPaymentData &&
    (FORCE_SHOW_STATUSES.includes(project.status) ||
      !HIDE_STAGES.includes(project.stage));

  const currentFiles = project.files.filter(
    (f) =>
      (f.status === "CURRENT" || f.status === "FINAL") &&
      !f.deletedAt &&
      canClientSeeFile(fileSecurityContext(f))
  );

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const paymentGatePassed = isPaymentGateSatisfied({
    paymentGateEnabled: project.paymentGateEnabled,
    paymentGateMode: project.paymentGateMode,
    paymentGateMilestoneId: project.paymentGateMilestoneId,
    payments: payments.map((p) => ({ id: p.id, status: p.status, lineKind: p.lineKind })),
  });

  const previewLinks = deliveryLinks.filter((l) => l.type === "PREVIEW");
  const finalLinks = deliveryLinks.filter((l) => l.type === "FINAL");

  const allFeedback = project.feedback;
  const welcomeName = project.clientName?.trim() || undefined;

  return (
    <div className="min-h-screen bg-neutral-950">
      <PublicPageRefresh />
      <ProjectHero
        project={project}
        welcomeName={welcomeName}
        freelancerName={
          project.user?.nickname?.trim() || project.user?.name?.trim() || "Your designer"
        }
        freelancerAvatarUrl={project.user?.avatarUrl}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <ProgressStages stage={project.stage} />

        {/* 2 — Latest deliverables */}
        {currentFiles.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Latest deliverables</h2>
            <div className="space-y-3">
              {currentFiles.map((file) => {
                const caps = getClientFileCapabilities(project.securityTier, file);
                const safe = serializeFileForClient(file);
                return (
                  <FileCard
                    key={file.id}
                    portalSlug={slug}
                    portalToken={token}
                    file={safe}
                    canDownload={caps.canDownload}
                    useProtectedPreview={caps.useProtectedPreview}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* 3 — Delivery links (preview + final) */}
        {deliveryLinks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Download your files</h2>
            <div className="space-y-3">
              {/* Preview / WIP links — always accessible */}
              {previewLinks.map((link) => (
                <a
                  key={link.id}
                  href={`/api/client/${slug}/${token}/delivery/${link.id}`}
                  className="flex items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-xl px-5 py-4 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 flex items-center justify-center transition-colors shrink-0">
                      <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white">{link.label}</span>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Preview files</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}

              {/* Final delivery links — gated behind payment */}
              {finalLinks.map((link) =>
                paymentGatePassed ? (
                  <a
                    key={link.id}
                    href={`/api/client/${slug}/${token}/delivery/${link.id}`}
                    className="flex items-center justify-between gap-4 bg-neutral-900 border border-neutral-700 hover:border-amber-700/60 rounded-xl px-5 py-4 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-900/30 group-hover:bg-amber-900/50 flex items-center justify-center transition-colors shrink-0">
                        <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white">{link.label}</span>
                        <p className="text-[11px] text-amber-400/80 mt-0.5">Final delivery · unlocked</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-4 bg-neutral-900/50 border border-neutral-800 rounded-xl px-5 py-4 opacity-70 cursor-not-allowed select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-neutral-400">{link.label}</span>
                        <p className="text-[11px] text-neutral-600 mt-0.5">Final delivery · awaiting payment</p>
                      </div>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 bg-neutral-800 text-neutral-500 rounded-full font-medium shrink-0">
                      Locked
                    </span>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* 4 — Payment summary */}
        {showPayments && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Payment summary</h2>
            <PaymentSummary
              total={
                project.totalPrice
                  ? Number(project.totalPrice)
                  : payments.reduce((s, p) => s + Number(p.amount), 0)
              }
              paid={totalPaid}
              currency={project.currency}
              payments={payments.map((p) => ({
                ...p,
                amount: Number(p.amount),
              }))}
            />
          </section>
        )}

        {/* 5 — RIB / bank details */}
        {showPayments && (project.user?.ribIban || project.user?.ribBic || project.user?.ribAccountHolder) && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Payment instructions</h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
              <p className="text-xs text-neutral-500">
                Transfer your payment to the following bank account and reference your project name.
              </p>
              <div className="space-y-2 pt-1">
                {project.user?.ribAccountHolder && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-neutral-500 w-28 shrink-0 pt-0.5">Account holder</span>
                    <span className="text-sm text-white font-medium">{project.user.ribAccountHolder}</span>
                  </div>
                )}
                {project.user?.ribBankName && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-neutral-500 w-28 shrink-0 pt-0.5">Bank</span>
                    <span className="text-sm text-white">{project.user.ribBankName}</span>
                  </div>
                )}
                {project.user?.ribIban && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-neutral-500 w-28 shrink-0 pt-0.5">IBAN</span>
                    <span className="text-sm text-white font-mono tracking-wider break-all">
                      {project.user.ribIban.replace(/(.{4})/g, "$1 ").trim()}
                    </span>
                  </div>
                )}
                {project.user?.ribBic && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-neutral-500 w-28 shrink-0 pt-0.5">BIC / SWIFT</span>
                    <span className="text-sm text-white font-mono">{project.user.ribBic}</span>
                  </div>
                )}
                <div className="flex items-start gap-3 pt-1 border-t border-neutral-800 mt-2">
                  <span className="text-xs text-neutral-500 w-28 shrink-0 pt-0.5">Reference</span>
                  <span className="text-sm text-neutral-300">{project.title}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6 — Feedback */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Leave feedback</h2>
          <FeedbackForm
            portalSlug={slug}
            portalToken={token}
            files={currentFiles}
            defaultDisplayName={welcomeName}
          />
        </section>

        {allFeedback.length > 0 && <FeedbackHistory feedback={allFeedback} />}

        {/* 7 — Work requests */}
        <ClientWorkRequests
          portalSlug={slug}
          portalToken={token}
          currency={project.currency}
          defaultDisplayName={welcomeName}
          initialRequests={project.workRequests.map((w) => ({
            id: w.id,
            title: w.title,
            description: w.description,
            status: w.status,
            submittedByName: w.submittedByName,
            submittedBySessionId: w.submittedBySessionId,
            projectClient: w.projectClient,
            quotedAmount: decimalToNumber(w.quotedAmount) ?? undefined,
            quotedNote: w.quotedNote,
            stripeLink: w.stripeLink,
            messages: w.messages.map((m) => ({
              id: m.id,
              fromClient: m.fromClient,
              body: m.body,
              createdAt: m.createdAt.toISOString(),
            })),
          }))}
        />

      </div>
    </div>
  );
}
