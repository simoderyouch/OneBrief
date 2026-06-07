import { prisma } from "@/lib/prisma";
import { resolvePublicPortal } from "@/lib/public-project";
import {
  defaultClientDisplayName,
  displayNameFromBody,
  sessionIdFromRequest,
} from "@/lib/client-portal-identity";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  const { slug, token } = await params;
  const result = await resolvePublicPortal(slug, token, request.headers, { logAccess: false });

  if (!result.ok) {
    const status =
      result.error === "NOT_FOUND" ? 404 : result.error === "RATE_LIMIT" ? 429 : 403;
    return Response.json({ error: "Access denied" }, { status });
  }

  const { project } = result;
  const body = await request.json();
  const { title, description } = body;

  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (typeof description !== "string" || !description.trim()) {
    return Response.json({ error: "Description is required" }, { status: 400 });
  }

  const submittedByName =
    displayNameFromBody(body) ?? defaultClientDisplayName(project);
  const submittedBySessionId = sessionIdFromRequest(request, body);

  const wr = await prisma.workRequest.create({
    data: {
      projectId: project.id,
      title: title.trim().slice(0, 200),
      description: description.trim(),
      submittedByName,
      submittedBySessionId,
    },
  });

  return Response.json(wr, { status: 201 });
}
