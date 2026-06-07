import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: { payments: true },
    orderBy: { updatedAt: "desc" },
  });

  const header = "id,title,clientName,clientEmail,status,stage,totalPrice,currency,paidTotal\n";
  const rows = projects.map((p) => {
    const paid = p.payments
      .filter((pay) => pay.status === "PAID")
      .reduce((s, pay) => s + Number(pay.amount), 0);
    return [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${(p.clientName || "").replace(/"/g, '""')}"`,
      p.clientEmail || "",
      p.status,
      p.stage,
      p.totalPrice ?? "",
      p.currency,
      paid,
    ].join(",");
  });

  const csv = header + rows.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="onebrief-export.csv"',
    },
  });
}
