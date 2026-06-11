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

  // Show payment summary once project reaches later stages
  const PAYMENT_STAGES = ["FINALS", "DELIVERY"];
  const PAYMENT_STATUSES = ["IN_REVISION", "DELIVERED", "COMPLETED", "WAITING_FEEDBACK"];
  const showPayments =
    PAYMENT_STAGES.includes(project.stage) ||
    PAYMENT_STATUSES.includes(project.status);

  const currentFiles = project.files.filter(
    (f) =>
      (f.status === "CURRENT" || f.status === "FINAL") &&
      !f.deletedAt &&
      canClientSeeFile(fileSecurityContext(f))
  );

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

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

        {/* Delivery links */}
        {deliveryLinks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Download your files</h2>
            <div className="space-y-3">
              {deliveryLinks.map((link) => (
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
                    <span className="text-sm font-medium text-white">{link.label}</span>
                  </div>
                  <svg className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Payment summary — shown at later stages only */}
        {showPayments && payments.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Payment summary</h2>
            <PaymentSummary
              total={Number(project.totalPrice ?? 0)}
              paid={totalPaid}
              currency={project.currency}
              payments={payments.map((p) => ({
                ...p,
                amount: Number(p.amount),
              }))}
            />
          </section>
        )}
      </div>
    </div>
  );
}
