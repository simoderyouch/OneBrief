import SharePreviewPageClient from "@/components/client/SharePreviewPageClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharePreviewPage({ params }: Props) {
  const { token } = await params;
  return <SharePreviewPageClient token={token} />;
}
