import { resolveFileShareLink } from "@/lib/file-share";
import {
  getClientFileCapabilities,
  streamFileResponse,
  type FileAccessIntent,
} from "@/lib/file-access";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const intent = (request.nextUrl.searchParams.get("intent") || "view") as FileAccessIntent;

  if (intent !== "view" && intent !== "download") {
    return Response.json({ error: "Invalid intent" }, { status: 400 });
  }

  const result = await resolveFileShareLink(token, request.headers, { incrementView: false });
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
  const tier = file.project.securityTier;
  const caps = getClientFileCapabilities(tier, file);
  const shareDownload = link.downloadAllowed || caps.canDownload;

  if (intent === "download" && !shareDownload) {
    return Response.json({ error: "Download not allowed" }, { status: 403 });
  }
  if (intent === "view" && caps.useProtectedPreview) {
    return Response.json(
      { error: "Use protected preview", previewPath: `/s/${token}/preview` },
      { status: 400 }
    );
  }

  return streamFileResponse({
    file,
    tier,
    intent,
    headers: request.headers,
    shareLinkId: link.id,
  });
}
