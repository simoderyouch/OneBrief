import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      notifyFeedback: true,
      notifyUpload: true,
      notifyStatus: true,
    },
  });

  return Response.json(user);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const data: {
    notifyFeedback?: boolean;
    notifyUpload?: boolean;
    notifyStatus?: boolean;
  } = {};
  if (typeof body.notifyFeedback === "boolean") data.notifyFeedback = body.notifyFeedback;
  if (typeof body.notifyUpload === "boolean") data.notifyUpload = body.notifyUpload;
  if (typeof body.notifyStatus === "boolean") data.notifyStatus = body.notifyStatus;

  if (Object.keys(data).length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notifyFeedback: true,
        notifyUpload: true,
        notifyStatus: true,
      },
    });
    return Response.json(user);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return Response.json({
    notifyFeedback: updated.notifyFeedback,
    notifyUpload: updated.notifyUpload,
    notifyStatus: updated.notifyStatus,
  });
}
