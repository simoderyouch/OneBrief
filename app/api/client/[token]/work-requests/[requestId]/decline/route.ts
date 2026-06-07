import { prisma } from "@/lib/prisma";
import { resolvePublicProject } from "@/lib/public-project";
import { getProjectClientFromRequest } from "@/lib/project-client-auth";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; requestId: string }> }
) {
  const { token, requestId } = await params;
  const result = await resolvePublicProject(token, request.headers, { logAccess: false });

  if (!result.ok) {
    const status =
      result.error === "NOT_FOUND" ? 404 : result.error === "RATE_LIMIT" ? 429 : 403;
    return Response.json({ error: "Access denied" }, { status });
  }

  const { project } = result;
  const client = await getProjectClientFromRequest(request, project.id);
  if (!client) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const wr = await prisma.workRequest.findFirst({
    where: { id: requestId, projectId: project.id },
  });

  if (!wr || wr.status !== "QUOTED") {
    return Response.json({ error: "Request not available to decline" }, { status: 400 });
  }

  if (!wr.projectClientId || wr.projectClientId !== client.id) {
    return Response.json({ error: "Not your request" }, { status: 403 });
  }

  const updated = await prisma.workRequest.update({
    where: { id: wr.id },
    data: { status: "DECLINED" },
  });

  return Response.json(updated);
}
