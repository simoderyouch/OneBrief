import FileSharePageClient from "@/components/client/FileSharePageClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function FileSharePage({ params }: Props) {
  const { token } = await params;
  return <FileSharePageClient token={token} />;
}
