import { resolvePublicPortal } from "@/lib/public-project";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  const { slug, token } = await params;
  const result = await resolvePublicPortal(slug, token, _request.headers, { logAccess: true });

  if (!result.ok) {
    const status =
      result.error === "NOT_FOUND"
        ? 404
        : result.error === "RATE_LIMIT"
          ? 429
          : 403;
    return Response.json({ error: "Access denied" }, { status });
  }

  const { project } = result;
  const { internalNote: _i, userId: _u, ...publicProject } = project;
  return Response.json(publicProject);
}
