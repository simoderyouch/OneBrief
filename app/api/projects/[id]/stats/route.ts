import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectStats } from "@/lib/stats";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const stats = await getProjectStats(id, session.user.id);
  if (!stats) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(stats);
}
