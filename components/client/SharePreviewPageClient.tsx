"use client";

import { useEffect, useState } from "react";
import ProtectedFilePreview from "@/components/client/ProtectedFilePreview";
import PublicAccessDenied from "@/components/client/PublicAccessDenied";
import Link from "next/link";

interface Props {
  token: string;
}

export default function SharePreviewPageClient({ token }: Props) {
  const [meta, setMeta] = useState<{
    label: string;
    watermark: string;
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/s/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = await res.json();
        setMeta({
          label: data.file?.label || "Preview",
          watermark: data.project?.clientName?.trim() || "DRAFT — CONFIDENTIAL",
        });
      })
      .catch(() => setError(true));
  }, [token]);

  if (error) {
    return <PublicAccessDenied reason="INACTIVE" />;
  }

  if (!meta) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={`/s/${token}`}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-semibold mt-4 mb-6">{meta.label}</h1>
        <ProtectedFilePreview
          imageUrl={`/api/s/${token}/preview`}
          watermarkText={meta.watermark}
          fileLabel={meta.label}
        />
      </div>
    </div>
  );
}
