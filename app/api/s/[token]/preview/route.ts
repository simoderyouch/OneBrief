import { getClientFileCapabilities, streamFileResponse } from "@/lib/file-access";
import { resolveFileShareLink } from "@/lib/file-share";
import { NextRequest } from "next/server";

/** Serves image bytes for watermarked preview on `/s/[token]/preview`. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

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
  const caps = getClientFileCapabilities(file.project.securityTier, file);

  if (!caps.useProtectedPreview) {
    return Response.json({ error: "Protected preview not required" }, { status: 400 });
  }

  return streamFileResponse({
    file,
    tier: file.project.securityTier,
    intent: "view",
    headers: request.headers,
    shareLinkId: link.id,
  });
}
