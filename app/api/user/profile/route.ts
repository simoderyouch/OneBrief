import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { nickname } = body;

  if (typeof nickname !== "string") {
    return Response.json({ error: "Nickname must be a string" }, { status: 400 });
  }

  const trimmed = nickname.trim();
  if (trimmed.length > 120) {
    return Response.json({ error: "Nickname must be 120 characters or less" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      nickname: trimmed || null,
      // Keep legacy `name` in sync for exports / older reads (optional mirror).
      name: trimmed || null,
    },
    select: { id: true, name: true, nickname: true, email: true },
  });

  return Response.json(updated);
}
