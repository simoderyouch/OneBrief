import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolvePublicProject } from "@/lib/public-project";
import { refreshPaymentOverdue } from "@/lib/payments";
import { decimalToNumber } from "@/lib/serialize";
import { getProjectClientFromCookies } from "@/lib/project-client-auth";
import ProjectHero from "@/components/client/ProjectHero";
import ProgressStages from "@/components/client/ProgressStages";
import FileCard from "@/components/client/FileCard";
import FeedbackForm from "@/components/client/FeedbackForm";
import FeedbackHistory from "@/components/client/FeedbackHistory";
import PaymentSummary from "@/components/client/PaymentSummary";
import ClientWorkRequests from "@/components/client/ClientWorkRequests";
import PublicAccessDenied from "@/components/client/PublicAccessDenied";
import PublicPageRefresh from "@/components/client/PublicPageRefresh";
import ClientAuthGate from "@/components/client/ClientAuthGate";
import ClientPortalBar from "@/components/client/ClientPortalBar";
import { getClientFileCapabilities, serializeFileForClient, fileSecurityContext } from "@/lib/file-access";
import { canClientSeeFile } from "@/lib/file-security";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ClientPage({ params }: Props) {
  const { token } = await params;
  const h = await headers();
  const result = await resolvePublicProject(token, h);

  if (!result.ok) {
    if (result.error === "NOT_FOUND") notFound();
    return <PublicAccessDenied reason={result.error} />;
  }

  const { project } = result;
  const portalClient = await getProjectClientFromCookies(project.id);

  if (!portalClient) {
    return (
      <ClientAuthGate
        token={token}
        projectTitle={project.title}
        freelancerName={
          project.user?.nickname?.trim() || project.user?.name?.trim() || "Your designer"
        }
        freelancerAvatarUrl={project.user?.avatarUrl}
      />
    );
  }

  await refreshPaymentOverdue(project.id);
  const payments = await prisma.payment.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  });

  const currentFiles = project.files.filter(
    (f) =>
      (f.status === "CURRENT" || f.status === "FINAL") &&
      !f.deletedAt &&
      canClientSeeFile(fileSecurityContext(f))
  );

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // All feedback (both open and resolved) for history display
  const allFeedback = project.feedback;

  return (
    <div className="min-h-screen bg-neutral-950">
      <PublicPageRefresh />
      <ClientPortalBar token={token} fullName={portalClient.fullName} />
      <ProjectHero
        project={project}
        welcomeName={portalClient.fullName}
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
                    token={token}
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
          <FeedbackForm token={token} files={currentFiles} />
        </section>

        {allFeedback.length > 0 && (
          <FeedbackHistory feedback={allFeedback} />
        )}

        <ClientWorkRequests
          token={token}
          currency={project.currency}
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

        {project.totalPrice && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Payment summary</h2>
            <PaymentSummary
              total={Number(project.totalPrice)}
              paid={totalPaid}
              currency={project.currency}
              payments={payments}
            />
          </section>
        )}
      </div>
    </div>
  );
}
