import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolvePublicPortal } from "@/lib/public-project";
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

  const link = await prisma.deliveryLink.findFirst({
    where: { id: linkId, projectId: result.project.id },
  });
  if (!link) return new Response("Not found", { status: 404 });

  await prisma.deliveryLink.update({
    where: { id: linkId },
    data: { clickCount: { increment: 1 } },
  });

  redirect(link.url);
}
