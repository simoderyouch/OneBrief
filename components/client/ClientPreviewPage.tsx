import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolvePublicPortal } from "@/lib/public-project";
import { getClientFileCapabilities } from "@/lib/file-access";
import { clientPortalApiBase } from "@/lib/client-portal-url";
import { prisma } from "@/lib/prisma";
import ProtectedFilePreview from "@/components/client/ProtectedFilePreview";
import PublicAccessDenied from "@/components/client/PublicAccessDenied";

export default async function ClientPreviewPage({
  slug,
  token,
  fileId,
}: {
  slug: string;
  token: string;
  fileId: string;
}) {
  const h = await headers();
  const result = await resolvePublicPortal(slug, token, h, { logAccess: false });

  if (!result.ok) {
    if (result.error === "NOT_FOUND") notFound();
    return <PublicAccessDenied reason={result.error} />;
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
    result.project.clientName?.trim() || "DRAFT — CONFIDENTIAL";

  const apiBase = clientPortalApiBase(slug, token);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={`/p/${slug}/${token}`}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ← Back to project
        </Link>
        <h1 className="text-xl font-semibold mt-4 mb-6">
          {file.label || "File preview"}
          <span className="ml-2 text-sm font-normal text-neutral-500">v{file.versionNumber}</span>
        </h1>
        <ProtectedFilePreview
          imageUrl={`${apiBase}/files/${fileId}/preview`}
          watermarkText={watermark}
          fileLabel={file.label || "Preview"}
        />
      </div>
    </div>
  );
}
