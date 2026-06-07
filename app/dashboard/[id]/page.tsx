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
    },
  });

  if (!project) notFound();

  const clientProject = serializeProjectForClient(project);

  const totalPaid = clientProject.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const openFeedback = project.feedback.filter((f: { status: string }) => f.status !== "RESOLVED");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <Link href="/dashboard" className="hover:text-neutral-300 transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-neutral-300 truncate">{project.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.title}</h1>
          {project.clientName && (
            <p className="text-neutral-400 text-sm mt-1">Client: {project.clientName}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EditProjectModal
            project={{
              id: clientProject.id,
              title: clientProject.title,
              description: clientProject.description,
              serviceType: clientProject.serviceType,
              clientName: clientProject.clientName,
              clientEmail: clientProject.clientEmail,
              deadline: clientProject.deadline,
              totalPrice: clientProject.totalPrice,
              currency: clientProject.currency,
              internalNote: clientProject.internalNote,
            }}
          />
          <ProjectDetailActions project={{
            id: project.id,
            token: project.token,
            tokenActive: project.tokenActive,
            tokenRevokedAt: project.tokenRevokedAt,
            tokenExpiresAt: project.tokenExpiresAt,
            status: project.status,
            stage: project.stage,
          }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Files */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Files</h2>
            <FileUpload projectId={project.id} />
            <FileList
              files={clientProject.files as Parameters<typeof FileList>[0]["files"]}
              projectId={project.id}
              securityTier={project.securityTier}
            />
          </section>

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

          {/* Feedback */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Feedback</h2>
              {openFeedback.length > 0 && (
                <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded-full">
                  {openFeedback.length} open
                </span>
              )}
            </div>
            <FeedbackList feedbackItems={project.feedback as any} projectId={project.id} />
          </section>

          {/* Internal notes */}
          {project.internalNote && (
            <section className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-5">
              <h2 className="font-semibold text-amber-300 text-sm mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Internal notes
              </h2>
              <p className="text-sm text-amber-200/70 whitespace-pre-wrap">{project.internalNote}</p>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Project info */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-300">Project Info</h3>
            {project.serviceType && (
              <div className="text-sm">
                <span className="text-neutral-500">Type</span>
                <p className="text-white">{project.serviceType}</p>
              </div>
            )}
            {project.deadline && (
              <div className="text-sm">
                <span className="text-neutral-500">Deadline</span>
                <p className="text-white">{new Date(project.deadline).toLocaleDateString()}</p>
              </div>
            )}
            {project.clientEmail && (
              <div className="text-sm">
                <span className="text-neutral-500">Client Email</span>
                <p className="text-white">{project.clientEmail}</p>
              </div>
            )}
          </div>

          {/* Payment summary */}
          {clientProject.totalPrice != null && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-neutral-300 mb-3">Payments</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total</span>
                  <span className="text-white">{clientProject.totalPrice.toLocaleString()} {project.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Paid</span>
                  <span className="text-green-400">{totalPaid.toLocaleString()} {project.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Remaining</span>
                  <span className="text-white">{(Number(project.totalPrice) - totalPaid).toLocaleString()} {project.currency}</span>
                </div>
              </div>
            </div>
          )}

          <PaymentTracker projectId={project.id} currency={project.currency} payments={clientProject.payments} />

          <SecurityTierSelector projectId={project.id} currentTier={project.securityTier} />

          {/* Client link */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-neutral-300 mb-2">Client Link</h3>
            <p className="text-xs text-neutral-500 mb-3">
              {project.tokenActive && !project.tokenRevokedAt
                ? project.tokenExpiresAt
                  ? `Active until ${new Date(project.tokenExpiresAt).toLocaleDateString()}`
                  : "Active — share with client"
                : "Disabled or revoked"}
            </p>
            <a
              href={`/p/${project.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
            >
              Open client view ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
