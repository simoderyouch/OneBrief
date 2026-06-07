import { prisma } from "@/lib/prisma";
import { resolvePublicPortal } from "@/lib/public-project";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string; requestId: string }> }
) {
  const { slug, token, requestId } = await params;
  const result = await resolvePublicPortal(slug, token, request.headers, { logAccess: false });

  if (!result.ok) {
    const status =
      result.error === "NOT_FOUND" ? 404 : result.error === "RATE_LIMIT" ? 429 : 403;
    return Response.json({ error: "Access denied" }, { status });
  }

  const { project } = result;

  const wr = await prisma.workRequest.findFirst({
    where: { id: requestId, projectId: project.id },
  });

  if (!wr || wr.status !== "QUOTED") {
    return Response.json({ error: "Request not available to decline" }, { status: 400 });
  }

  const updated = await prisma.workRequest.update({
    where: { id: wr.id },
    data: { status: "DECLINED" },
  });

  return Response.json(updated);
}
