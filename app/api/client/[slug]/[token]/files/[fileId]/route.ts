import {
  getClientFileCapabilities,
  streamFileResponse,
  type FileAccessIntent,
} from "@/lib/file-access";
import { buildClientPortalPreviewPath } from "@/lib/client-portal-url";
import { resolvePublicPortal } from "@/lib/public-project";
import { fileProjectInclude } from "@/lib/file-project-include";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string; fileId: string }> }
) {
  const { slug, token, fileId } = await params;
  const intent = (request.nextUrl.searchParams.get("intent") || "view") as FileAccessIntent;

  if (intent !== "view" && intent !== "download") {
    return Response.json({ error: "Invalid intent" }, { status: 400 });
  }

  const result = await resolvePublicPortal(slug, token, request.headers, { logAccess: false });
  if (!result.ok) {
    const status =
      result.error === "NOT_FOUND"
        ? 404
        : result.error === "RATE_LIMIT"
          ? 429
          : 403;
    return Response.json({ error: "Access denied" }, { status });
  }

  const file = await prisma.file.findFirst({
    where: { id: fileId, projectId: result.project.id, deletedAt: null },
    include: fileProjectInclude,
  });

  if (!file) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  const projectWithPayments = {
    ...file.project,
    payments: file.project.payments,
  };
  const caps = getClientFileCapabilities(
    result.project.securityTier,
    file,
    projectWithPayments
  );
  if (intent === "download" && !caps.canDownload) {
    return Response.json({ error: "Download not allowed" }, { status: 403 });
  }
  if (intent === "view" && caps.useProtectedPreview) {
    return Response.json(
      { error: "Use protected preview", previewPath: buildClientPortalPreviewPath(slug, token, fileId) },
      { status: 400 }
    );
  }

  return streamFileResponse({
    file,
    tier: result.project.securityTier,
    intent,
    headers: request.headers,
  });
}
