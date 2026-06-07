import { resolveFileShareLink } from "@/lib/file-share";
import { getClientFileCapabilities, serializeFileForClient } from "@/lib/file-access";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await resolveFileShareLink(token, request.headers, { incrementView: true });

  if (!result.ok) {
    const status =
      result.error === "NOT_FOUND"
        ? 404
        : result.error === "RATE_LIMIT"
          ? 429
          : 403;
    return Response.json({ error: result.error }, { status });
  }

  const { link } = result;
  const file = link.file;
  const project = file.project;
  const tier = project.securityTier;

  const caps = getClientFileCapabilities(tier, file, file.project);
  const shareDownload = link.downloadAllowed || caps.canDownload;

  return Response.json({
    file: serializeFileForClient(file),
    project: {
      title: project.title,
      clientName: project.clientName,
      freelancerName:
        project.user?.nickname?.trim() || project.user?.name?.trim() || "Designer",
    },
    shareLink: {
      viewCount: link.viewCount,
      maxViews: link.maxViews,
      expiresAt: link.expiresAt,
      downloadAllowed: shareDownload,
    },
    capabilities: {
      canView: caps.canView,
      canDownload: shareDownload,
      useProtectedPreview: caps.useProtectedPreview,
    },
  });
}
