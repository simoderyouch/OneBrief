import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublicProject } from "@/lib/public-project";
import { getProjectClientFromCookies } from "@/lib/project-client-auth";
import { getClientFileCapabilities } from "@/lib/file-access";
import { prisma } from "@/lib/prisma";
import ProtectedFilePreview from "@/components/client/ProtectedFilePreview";
import PublicAccessDenied from "@/components/client/PublicAccessDenied";
import Link from "next/link";

interface Props {
  params: Promise<{ token: string; fileId: string }>;
}

export default async function ProjectFilePreviewPage({ params }: Props) {
  const { token, fileId } = await params;
  const h = await headers();
  const result = await resolvePublicProject(token, h, { logAccess: false });

  if (!result.ok) {
    if (result.error === "NOT_FOUND") notFound();
    return <PublicAccessDenied reason={result.error} />;
  }

  const portalClient = await getProjectClientFromCookies(result.project.id);
  if (!portalClient) {
    notFound();
  }

  const file = await prisma.file.findFirst({
    where: { id: fileId, projectId: result.project.id, deletedAt: null },
  });

  if (!file) notFound();

  const caps = getClientFileCapabilities(result.project.securityTier, file);
  if (!caps.useProtectedPreview) {
    notFound();
  }

  const watermark =
    result.project.clientName?.trim() ||
    portalClient.fullName ||
    "DRAFT — CONFIDENTIAL";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={`/p/${token}`}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ← Back to project
        </Link>
        <h1 className="text-xl font-semibold mt-4 mb-6">
          {file.label || "File preview"}
          <span className="ml-2 text-sm font-normal text-neutral-500">v{file.versionNumber}</span>
        </h1>
        <ProtectedFilePreview
          imageUrl={`/api/client/${token}/files/${fileId}/preview`}
          watermarkText={watermark}
          fileLabel={file.label || "Preview"}
        />
      </div>
    </div>
  );
}
