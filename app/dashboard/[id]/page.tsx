import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshPaymentOverdue } from "@/lib/payments";
import { serializeProjectForClient } from "@/lib/serialize";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import FileUpload from "@/components/dashboard/FileUpload";
import FileList from "@/components/dashboard/FileList";
import FeedbackList from "@/components/dashboard/FeedbackList";
import ProjectDetailActions from "@/components/dashboard/ProjectDetailActions";
import PaymentTracker from "@/components/dashboard/PaymentTracker";
import WorkRequestPanel from "@/components/dashboard/WorkRequestPanel";
import SecurityTierSelector from "@/components/dashboard/SecurityTierSelector";
import PackageManager from "@/components/dashboard/PackageManager";
import PaymentGateSettings from "@/components/dashboard/PaymentGateSettings";
import NotifyWhatsApp from "@/components/dashboard/NotifyWhatsApp";
import EditProjectModal from "@/components/dashboard/EditProjectModal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const { id } = await params;

  await refreshPaymentOverdue(id);

  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: {
      files: { where: { deletedAt: null }, orderBy: { uploadedAt: "desc" } },
      feedback: {
        include: { file: true, projectClient: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      },
      payments: { orderBy: { createdAt: "asc" } },
      workRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          projectClient: { select: { fullName: true } },
        },
      },
      packages: {
        include: { files: { where: { deletedAt: null }, orderBy: { uploadedAt: "desc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!project) notFound();

  const clientProject = serializeProjectForClient(project);

  const openFeedback = project.feedback.filter((f: { status: string }) => f.status !== "RESOLVED");

  return (
    <div className="page-shell">
      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
        <Link href="/dashboard" className="hover:text-neutral-300 transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-neutral-400 truncate">{project.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">{project.title}</h1>
          {project.clientName && (
            <p className="page-subtitle">Client: {project.clientName}</p>
          )}
          {project.description && (
            <p className="text-sm text-neutral-500 mt-2 max-w-2xl">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <EditProjectModal
            project={{
              id: clientProject.id,
              title: clientProject.title,
              description: clientProject.description,
              serviceType: clientProject.serviceType,
              clientName: clientProject.clientName,
              clientEmail: clientProject.clientEmail,
              clientWhatsapp: project.clientWhatsapp,
              deadline: clientProject.deadline,
              totalPrice: clientProject.totalPrice,
              currency: clientProject.currency,
              internalNote: clientProject.internalNote,
            }}
          />
          <ProjectDetailActions project={{
            id: project.id,
            title: project.title,
            clientName: project.clientName,
            token: project.token,
            tokenActive: project.tokenActive,
            tokenRevokedAt: project.tokenRevokedAt,
            tokenExpiresAt: project.tokenExpiresAt,
            status: project.status,
            stage: project.stage,
          }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="panel-padded">
            <h2 className="text-sm font-medium text-neutral-300 mb-4">Files</h2>
            <FileUpload projectId={project.id} />
            <FileList
              files={clientProject.files as Parameters<typeof FileList>[0]["files"]}
              projectId={project.id}
              securityTier={project.securityTier}
            />
          </section>

          <PackageManager projectId={project.id} packages={project.packages} />

          <WorkRequestPanel
            projectId={project.id}
            currency={project.currency}
            requests={project.workRequests.map((w) => ({
              id: w.id,
              title: w.title,
              description: w.description,
              status: w.status,
              submittedByName: w.submittedByName,
              submittedBySessionId: w.submittedBySessionId,
              projectClient: w.projectClient,
              quotedAmount: w.quotedAmount != null ? Number(w.quotedAmount) : undefined,
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

          <section className="panel-padded">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-neutral-300">Feedback</h2>
              {openFeedback.length > 0 && (
                <span className="badge-warn">{openFeedback.length} open</span>
              )}
            </div>
            <FeedbackList feedbackItems={project.feedback as Parameters<typeof FeedbackList>[0]["feedbackItems"]} projectId={project.id} />
          </section>

          {project.internalNote && (
            <section className="panel-padded border-neutral-700/40">
              <h2 className="text-sm font-medium text-neutral-400 mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Internal notes
              </h2>
              <p className="text-sm text-neutral-500 whitespace-pre-wrap">{project.internalNote}</p>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <div className="panel-padded space-y-3">
            <h3 className="text-sm font-medium text-neutral-400">Contact</h3>
            {project.serviceType && (
              <div className="text-sm">
                <span className="text-neutral-600">Type</span>
                <p className="text-neutral-200">{project.serviceType}</p>
              </div>
            )}
            {project.deadline && (
              <div className="text-sm">
                <span className="text-neutral-600">Deadline</span>
                <p className="text-neutral-200">{new Date(project.deadline).toLocaleDateString()}</p>
              </div>
            )}
            {project.clientEmail && (
              <div className="text-sm">
                <span className="text-neutral-600">Client email</span>
                <p className="text-neutral-200">{project.clientEmail}</p>
              </div>
            )}
          </div>

          <PaymentTracker projectId={project.id} currency={project.currency} payments={clientProject.payments} />

          <PaymentGateSettings
            projectId={project.id}
            paymentGateEnabled={project.paymentGateEnabled}
            paymentGateMode={project.paymentGateMode}
            paymentGateMilestoneId={project.paymentGateMilestoneId}
            autoUnlockOnPayment={project.autoUnlockOnPayment}
            milestones={project.payments
              .filter((p) => p.lineKind === "MILESTONE")
              .map((p) => ({ id: p.id, label: p.label }))}
          />

          <SecurityTierSelector projectId={project.id} currentTier={project.securityTier} />

          <NotifyWhatsApp projectId={project.id} clientWhatsapp={project.clientWhatsapp} />
        </div>
      </div>
    </div>
  );
}
