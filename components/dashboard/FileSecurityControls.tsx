"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SecurityTier } from "@prisma/client";

interface FileSecurityControlsProps {
  file: {
    id: string;
    label: string | null;
    clientVisible: boolean;
    downloadAllowed: boolean;
    status: string;
  };
  securityTier: SecurityTier;
}

type ShareLinkRow = {
  id: string;
  tokenActive: boolean;
  downloadAllowed: boolean;
  maxViews: number | null;
  viewCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type Stats = {
  views: number;
  downloads: number;
  lastAccessedAt: string | null;
  tier?: string;
  message?: string;
};

export default function FileSecurityControls({ file, securityTier }: FileSecurityControlsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientVisible, setClientVisible] = useState(file.clientVisible);
  const [downloadAllowed, setDownloadAllowed] = useState(file.downloadAllowed);
  const [links, setLinks] = useState<ShareLinkRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState<string | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);

  const loadMeta = useCallback(async () => {
    const [linksRes, statsRes] = await Promise.all([
      fetch(`/api/files/${file.id}/share-links`),
      fetch(`/api/files/${file.id}/stats`),
    ]);
    if (linksRes.ok) setLinks(await linksRes.json());
    if (statsRes.ok) setStats(await statsRes.json());
  }, [file.id]);

  useEffect(() => {
    if (open) loadMeta();
  }, [open, loadMeta]);

  async function saveSettings() {
    setSaving(true);
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientVisible, downloadAllowed }),
    });
    setSaving(false);
    router.refresh();
  }

  async function createShareLink() {
    setCreatingLink(true);
    setNewLinkUrl(null);
    const res = await fetch(`/api/files/${file.id}/share-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadAllowed, maxViews: 50, ttlDays: 30 }),
    });
    const data = await res.json();
    if (data.url) setNewLinkUrl(data.url);
    setCreatingLink(false);
    loadMeta();
  }

  async function revokeLink(linkId: string) {
    await fetch(`/api/files/${file.id}/share-links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenActive: false }),
    });
    loadMeta();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded transition-colors"
        title="Security & sharing"
      >
        Security
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-neutral-800 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">File security</h3>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{file.label || "File"}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-neutral-500 hover:text-white text-sm"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientVisible}
                    onChange={(e) => setClientVisible(e.target.checked)}
                    className="rounded border-neutral-600"
                  />
                  Visible on client portal
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={downloadAllowed}
                    onChange={(e) => setDownloadAllowed(e.target.checked)}
                    className="rounded border-neutral-600"
                  />
                  Allow download
                  {file.status === "FINAL" && (
                    <span className="text-xs text-neutral-500">(finals always downloadable)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full py-2 bg-white text-neutral-900 rounded-lg text-sm font-semibold hover:bg-neutral-100 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save settings"}
                </button>
              </div>

              {securityTier !== "BASIC" && stats && (
                <div className="rounded-lg border border-neutral-800 p-3 space-y-1">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                    Access log
                  </p>
                  {stats.message ? (
                    <p className="text-xs text-neutral-500">{stats.message}</p>
                  ) : (
                    <>
                      <p className="text-sm text-white">
                        {stats.views} views · {stats.downloads} downloads
                      </p>
                      {stats.lastAccessedAt && (
                        <p className="text-xs text-neutral-500">
                          Last accessed {new Date(stats.lastAccessedAt).toLocaleString()}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                    Share link
                  </p>
                  <button
                    type="button"
                    onClick={createShareLink}
                    disabled={creatingLink}
                    className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded disabled:opacity-50"
                  >
                    {creatingLink ? "Creating…" : "Create link"}
                  </button>
                </div>
                <p className="text-xs text-neutral-500">
                  Narrow-scope link for this file only. Tracks views and supports expiry.
                </p>

                {newLinkUrl && (
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 space-y-2">
                    <p className="text-xs text-neutral-400 font-medium">New link created</p>
                    <p className="text-xs text-neutral-500 break-all">{newLinkUrl}</p>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(newLinkUrl)}
                      className="text-xs link-subtle no-underline hover:underline"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                )}

                {links.length > 0 && (
                  <ul className="space-y-2">
                    {links.map((link) => (
                      <li
                        key={link.id}
                        className="flex items-center justify-between gap-2 text-xs border border-neutral-800 rounded-lg px-3 py-2"
                      >
                        <div className="text-neutral-400">
                          <span className={link.tokenActive && !link.revokedAt ? "text-neutral-400" : "text-neutral-600"}>
                            {link.tokenActive && !link.revokedAt ? "Active" : "Revoked"}
                          </span>
                          {" · "}
                          {link.viewCount}
                          {link.maxViews != null ? `/${link.maxViews}` : ""} views
                        </div>
                        {link.tokenActive && !link.revokedAt && (
                          <button
                            type="button"
                            onClick={() => revokeLink(link.id)}
                            className="text-neutral-500 hover:text-neutral-300 shrink-0"
                          >
                            Revoke
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
