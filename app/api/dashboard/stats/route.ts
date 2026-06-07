import { auth } from "@/lib/auth";
import { getDashboardStats, getRecentActivity, getBusinessStats, getProtectionReport } from "@/lib/stats";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [summary, activity, business, protection] = await Promise.all([
    getDashboardStats(session.user.id),
    getRecentActivity(session.user.id),
    getBusinessStats(session.user.id),
    getProtectionReport(session.user.id),
  ]);

  return Response.json({ summary, activity, business, protection });
}
