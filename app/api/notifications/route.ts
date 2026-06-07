import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { sentTo: "FREELANCER", project: { userId: session.user.id } },
    include: { project: { select: { id: true, title: true } } },
    orderBy: { sentAt: "desc" },
    take: 100,
  });

  return Response.json(notifications);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { sentTo: "FREELANCER", readAt: null, project: { userId: session.user.id } },
      data: { readAt: new Date() },
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Invalid request" }, { status: 400 });
}
