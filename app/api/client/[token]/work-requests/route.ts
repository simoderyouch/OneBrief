import { prisma } from "@/lib/prisma";
import { resolvePublicProject } from "@/lib/public-project";
import { getProjectClientFromRequest } from "@/lib/project-client-auth";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
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

  const body = await request.json();
  const { title, description } = body;

  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (typeof description !== "string" || !description.trim()) {
    return Response.json({ error: "Description is required" }, { status: 400 });
  }

  const wr = await prisma.workRequest.create({
    data: {
      projectId: project.id,
      title: title.trim().slice(0, 200),
      description: description.trim(),
      projectClientId: client.id,
      submittedByName: client.fullName,
      submittedBySessionId: null,
    },
  });

  return Response.json(wr, { status: 201 });
}
