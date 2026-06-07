"use client";

import { useEffect, useState } from "react";
import SecureFileActions from "@/components/client/SecureFileActions";
import ProtectedFilePreview from "@/components/client/ProtectedFilePreview";
import PublicAccessDenied from "@/components/client/PublicAccessDenied";

interface SharePageData {
  file: {
    id: string;
    label: string | null;
    versionNumber: number;
    format: string | null;
    status: string;
  };
  project: {
    title: string;
    clientName: string | null;
    freelancerName: string;
  };
  shareLink: {
    viewCount: number;
    maxViews: number | null;
    expiresAt: string | null;
    downloadAllowed: boolean;
  };
  capabilities: {
    canView: boolean;
    canDownload: boolean;
    useProtectedPreview: boolean;
  };
}

interface Props {
  token: string;
}

export default function FileSharePageClient({ token }: Props) {
  const [data, setData] = useState<SharePageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch(`/api/s/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setError(body.error || "ACCESS_DENIED");
          return;
        }
        const json = (await res.json()) as SharePageData;
        setData(json);
        if (json.capabilities.useProtectedPreview) {
          setShowPreview(true);
        }
      })
      .catch(() => setError("ACCESS_DENIED"));
  }, [token]);

  if (error) {
    const reason =
      error === "MAX_VIEWS"
        ? ("MAX_VIEWS" as const)
        : error === "RATE_LIMIT"
          ? ("RATE_LIMIT" as const)
          : error === "NOT_FOUND"
            ? ("INACTIVE" as const)
            : error === "EXPIRED" || error === "REVOKED"
              ? (error as "EXPIRED" | "REVOKED")
              : ("INACTIVE" as const);
    return <PublicAccessDenied reason={reason} />;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-500 text-sm">
        Loading…
      </div>
    );
  }

  const watermark = data.project.clientName?.trim() || "DRAFT — CONFIDENTIAL";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <header className="space-y-1">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Shared file</p>
          <h1 className="text-2xl font-semibold">{data.file.label || "File"}</h1>
          <p className="text-sm text-neutral-400">
            {data.project.freelancerName} · {data.project.title}
          </p>
          <p className="text-xs text-neutral-600">
            Viewed {data.shareLink.viewCount}
            {data.shareLink.maxViews != null ? ` / ${data.shareLink.maxViews}` : ""} times
            {data.shareLink.expiresAt &&
              ` · Expires ${new Date(data.shareLink.expiresAt).toLocaleDateString()}`}
          </p>
        </header>

        {showPreview && data.capabilities.useProtectedPreview ? (
          <ProtectedFilePreview
            imageUrl={`/api/s/${token}/preview`}
            watermarkText={watermark}
            fileLabel={data.file.label || "Preview"}
          />
        ) : (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center space-y-4">
            <p className="text-neutral-400 text-sm">
              {data.file.label} · v{data.file.versionNumber}
              {data.file.format ? ` · .${data.file.format.toUpperCase()}` : ""}
            </p>
            <SecureFileActions
              token={token}
              fileId={data.file.id}
              label={data.file.label}
              canDownload={data.capabilities.canDownload}
              useProtectedPreview={false}
              context="share"
            />
          </div>
        )}

        {data.capabilities.useProtectedPreview && (
          <div className="flex justify-center">
            <SecureFileActions
              token={token}
              fileId={data.file.id}
              label={data.file.label}
              canDownload={data.capabilities.canDownload}
              useProtectedPreview={false}
              context="share"
            />
          </div>
        )}
      </div>
    </div>
  );
}
