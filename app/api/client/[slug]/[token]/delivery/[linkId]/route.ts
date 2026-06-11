import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolvePublicPortal } from "@/lib/public-project";
import { isPaymentGateSatisfied } from "@/lib/payment-gate";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string; linkId: string }> }
) {
  const { slug, token, linkId } = await params;
  const h = await headers();

  const result = await resolvePublicPortal(slug, token, h, { logAccess: false });
  if (!result.ok) return new Response("Not found", { status: 404 });

  const { project } = result;

  const link = await prisma.deliveryLink.findFirst({
    where: { id: linkId, projectId: project.id },
  });
  if (!link) return new Response("Not found", { status: 404 });

  // FINAL links are gated behind the project payment gate
  if (link.type === "FINAL") {
    const payments = await prisma.payment.findMany({
      where: { projectId: project.id },
      select: { id: true, status: true, lineKind: true },
    });

    const gateSatisfied = isPaymentGateSatisfied({
      paymentGateEnabled: project.paymentGateEnabled,
      paymentGateMode: project.paymentGateMode,
      paymentGateMilestoneId: project.paymentGateMilestoneId,
      payments,
    });

    if (!gateSatisfied) {
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Payment required</title>
        <style>body{font-family:sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
        .box{background:#161616;border:1px solid #262626;border-radius:16px;padding:40px;max-width:400px;text-align:center}
        .icon{font-size:2rem;margin-bottom:16px}h2{margin:0 0 8px}p{color:#737373;margin:0 0 24px;font-size:14px}
        a{display:inline-block;padding:10px 20px;background:#262626;color:#fff;border-radius:8px;text-decoration:none;font-size:14px}</style>
        </head><body><div class="box"><div class="icon">🔒</div>
        <h2>Payment required</h2>
        <p>This file will be unlocked once payment is confirmed.</p>
        <a href="javascript:history.back()">← Go back</a></div></body></html>`,
        { status: 402, headers: { "Content-Type": "text/html" } }
      );
    }
  }

  await prisma.deliveryLink.update({
    where: { id: linkId },
    data: { clickCount: { increment: 1 } },
  });

  redirect(link.url);
}
