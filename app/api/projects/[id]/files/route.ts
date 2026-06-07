import { getAuthenticatedUser, isDatabaseConnectivityError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/supabase";
import { validateUploadFile } from "@/lib/file-validation";
import { newVersionEmail } from "@/lib/email";
import { sendClientEmailWithLog } from "@/lib/notify";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedUser();
  if (!authResult.ok) {
    if (authResult.reason === "database_unavailable") {
      return Response.json({ error: authResult.message }, { status: 503 });
    }
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const owned = await prisma.project.findFirst({
      where: { id, userId: authResult.user.id },
      select: { id: true },
    });
    if (!owned) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const files = await prisma.file.findMany({
      where: { projectId: id, deletedAt: null },
      orderBy: { uploadedAt: "desc" },
    });
    return Response.json(files);
  } catch (err) {
    if (isDatabaseConnectivityError(err)) {
      return Response.json(
        { error: "Database temporarily unavailable. Try again in a moment." },
        { status: 503 }
      );
    }
    throw err;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedUser();
  if (!authResult.ok) {
    if (authResult.reason === "database_unavailable") {
      return Response.json({ error: authResult.message }, { status: 503 });
    }
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = authResult;

  const { id } = await params;

  try {
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const label = formData.get("label") as string | null;
    const note = formData.get("note") as string | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const check = validateUploadFile({ name: file.name, size: file.size, type: file.type });
    if (!check.ok) {
      return Response.json({ error: check.error }, { status: 400 });
    }

    const lastFile = await prisma.file.findFirst({
      where: {
        projectId: id,
        label: label || undefined,
        deletedAt: null,
      },
      orderBy: { versionNumber: "desc" },
    });
    const versionNumber = lastFile ? lastFile.versionNumber + 1 : 1;

    if (lastFile) {
      await prisma.file.updateMany({
        where: { projectId: id, label: label || undefined, status: "CURRENT", deletedAt: null },
        data: { status: "SUPERSEDED" },
      });
    }

    const uploaded = await uploadFile(file, id);

    const fileRecord = await prisma.file.create({
      data: {
        projectId: id,
        parentId: lastFile?.id,
        label: label || file.name,
        cloudinaryUrl: uploaded.url,
        publicId: uploaded.storagePath,
        format: uploaded.format,
        mimeType: file.type || undefined,
        sizeBytes: uploaded.sizeBytes,
        versionNumber,
        note: note || undefined,
        status: "CURRENT",
      },
    });

    const owner = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notifyUpload: true },
    });

    if (
      project.clientEmail &&
      owner?.notifyUpload &&
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY.length > 0
    ) {
      const html = newVersionEmail(
        project.clientName || "there",
        project.title,
        versionNumber,
        note || "",
        undefined
      );
      await sendClientEmailWithLog({
        projectId: project.id,
        type: "VERSION_UPLOADED",
        toEmail: project.clientEmail,
        subject: `New version: ${project.title}`,
        html,
        templateKey: "version_uploaded",
      });
    }

    return Response.json(fileRecord, { status: 201 });
  } catch (err) {
    if (isDatabaseConnectivityError(err)) {
      return Response.json(
        {
          error:
            "Cannot reach the database right now. Check your connection or try again shortly.",
        },
        { status: 503 }
      );
    }
    throw err;
  }
}
