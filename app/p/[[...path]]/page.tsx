import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  buildProjectSlug,
  parsePortalTokenFromUrlSegment,
} from "@/lib/client-portal-url";
import ClientPortalPage from "@/components/client/ClientPortalPage";
import ClientPreviewPage from "@/components/client/ClientPreviewPage";

interface Props {
  params: Promise<{ path?: string[] }>;
}

/**
 * Handles all client portal URLs under `/p/…`:
 * - `/p/{slug}/{hash}` — project portal
 * - `/p/{slug}/{hash}/preview/{fileId}` — protected preview
 * - `/p/{legacy-segment}` — old links → redirect to canonical slug/hash
 */
export default async function PortalCatchAllPage({ params }: Props) {
  const { path: segments } = await params;

  if (!segments || segments.length === 0) {
    notFound();
  }

  if (segments.length === 1) {
    const stored = parsePortalTokenFromUrlSegment(segments[0]);
    const project = await prisma.project.findFirst({
      where: { token: stored },
      select: { token: true, title: true, clientName: true },
    });
    if (!project) notFound();
    const slug = buildProjectSlug(project.title, project.clientName);
    redirect(`/p/${slug}/${project.token}`);
  }

  if (segments.length === 2) {
    const [slug, token] = segments;
    return <ClientPortalPage slug={slug} token={token} />;
  }

  if (segments.length === 4 && segments[2] === "preview") {
    const [slug, token, , fileId] = segments;
    return <ClientPreviewPage slug={slug} token={token} fileId={fileId} />;
  }

  notFound();
}
