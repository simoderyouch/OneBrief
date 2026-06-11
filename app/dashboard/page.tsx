import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeProjectsForClient } from "@/lib/serialize";
import { getProjectViewSummaries } from "@/lib/client-activity";
import { redirect } from "next/navigation";
import ProjectCard from "@/components/dashboard/ProjectCard";
import CreateProjectModal from "@/components/dashboard/CreateProjectModal";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      files: { where: { status: "CURRENT" }, take: 1 },
      feedback: { where: { status: "OPEN" } },
      payments: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const clientProjects = serializeProjectsForClient(projects);
  const viewSummaries = await getProjectViewSummaries(
    session.user.id,
    clientProjects.map((p) => p.id)
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-neutral-400 text-sm mt-1">{clientProjects.length} active project{clientProjects.length !== 1 ? "s" : ""}</p>
        </div>
        <CreateProjectModal />
      </div>

      {clientProjects.length === 0 ? (
        <div className="text-center py-24 bg-neutral-900 rounded-2xl border border-neutral-800">
          <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-neutral-500 text-sm">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clientProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewSummary={viewSummaries.get(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
