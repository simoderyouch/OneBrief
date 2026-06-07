import {
  getClientFileCapabilities,
  streamFileResponse,
} from "@/lib/file-access";
import { resolvePublicPortal } from "@/lib/public-project";
import { fileProjectInclude } from "@/lib/file-project-include";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/** Serves image bytes for the watermarked preview page (PROTECTED tier). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string; fileId: string }> }
) {
  const { slug, token, fileId } = await params;

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

  const caps = getClientFileCapabilities(
    result.project.securityTier,
    file,
    file.project
  );
  if (!caps.useProtectedPreview) {
    return Response.json({ error: "Protected preview not required" }, { status: 400 });
  }

  return streamFileResponse({
    file,
    tier: result.project.securityTier,
    intent: "view",
    headers: request.headers,
  });
}
