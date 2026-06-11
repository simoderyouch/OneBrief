"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link, Plus, Trash2, Pencil, Check, X, ExternalLink, MousePointerClick, Clock } from "lucide-react";

interface DeliveryLink {
  id: string;
  label: string;
  url: string;
  type: "PREVIEW" | "FINAL";
  clickCount: number;
  updatedAt: string;
}

interface Props {
  projectId: string;
  initialLinks: DeliveryLink[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DeliveryLinksPanel({ projectId, initialLinks }: Props) {
  const router = useRouter();
  const [links, setLinks] = useState<DeliveryLink[]>(initialLinks);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<"PREVIEW" | "FINAL">("PREVIEW");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editType, setEditType] = useState<"PREVIEW" | "FINAL">("PREVIEW");

  async function addLink() {
    if (!newUrl.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/delivery-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel, url: newUrl, type: newType }),
    });
    const link = await res.json() as DeliveryLink;
    setLinks((prev) => [...prev, link]);
    setNewLabel("");
    setNewUrl("");
    setNewType("PREVIEW");
    setAdding(false);
    setSaving(false);
    router.refresh();
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/delivery-links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel, url: editUrl, type: editType }),
    });
    const updated = await res.json() as DeliveryLink;
    setLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
    setEditingId(null);
    setSaving(false);
    router.refresh();
  }

  async function deleteLink(id: string) {
    await fetch(`/api/projects/${projectId}/delivery-links/${id}`, { method: "DELETE" });
    setLinks((prev) => prev.filter((l) => l.id !== id));
    router.refresh();
  }

  function startEdit(link: DeliveryLink) {
    setEditingId(link.id);
    setEditLabel(link.label);
    setEditUrl(link.url);
    setEditType(link.type);
  }

  return (
    <section className="panel-padded">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
          <Link className="w-4 h-4 text-neutral-500" />
          Delivery links
        </h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add link
          </button>
        )}
      </div>

      <div className="space-y-2">
        {links.map((link) =>
          editingId === link.id ? (
            <div key={link.id} className="bg-neutral-800 rounded-lg p-3 space-y-2">
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Label (e.g. Final files v2)"
                className="w-full px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <TypeToggle value={editType} onChange={setEditType} />
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(link.id)}
                  disabled={saving || !editUrl.trim()}
                  className="flex items-center gap-1 px-3 py-1 bg-white text-neutral-900 rounded text-xs font-semibold disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex items-center gap-1 px-3 py-1 border border-neutral-600 text-neutral-400 rounded text-xs hover:text-white"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={link.id}
              className="flex items-center justify-between gap-3 bg-neutral-800/50 border border-neutral-800 rounded-lg px-3 py-2.5 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{link.label}</p>
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${
                    link.type === "FINAL"
                      ? "bg-amber-900/40 text-amber-300 border border-amber-800/50"
                      : "bg-neutral-700 text-neutral-400"
                  }`}>
                    {link.type === "FINAL" ? "🔒 Final" : "Preview"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 truncate">{link.url}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-neutral-600">
                    <MousePointerClick className="w-3 h-3" />
                    {link.clickCount} click{link.clickCount !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-neutral-600">
                    <Clock className="w-3 h-3" />
                    {timeAgo(link.updatedAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-neutral-500 hover:text-white rounded transition-colors"
                  title="Open link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => startEdit(link)}
                  className="p-1.5 text-neutral-500 hover:text-white rounded transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteLink(link.id)}
                  className="p-1.5 text-neutral-500 hover:text-red-400 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        )}

        {links.length === 0 && !adding && (
          <p className="text-xs text-neutral-600 italic">
            No delivery links yet. Add a DocSend, Google Drive, or any download link.
          </p>
        )}
      </div>

      {adding && (
        <div className="mt-3 bg-neutral-800 rounded-lg p-3 space-y-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g. Final logos, Brand guidelines…)"
            autoFocus
            className="w-full px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://docsend.com/view/... or any URL"
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            className="w-full px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
          <TypeToggle value={newType} onChange={setNewType} />
          <div className="flex gap-2">
            <button
              onClick={addLink}
              disabled={saving || !newUrl.trim()}
              className="flex items-center gap-1 px-3 py-1 bg-white text-neutral-900 rounded text-xs font-semibold disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewLabel(""); setNewUrl(""); }}
              className="flex items-center gap-1 px-3 py-1 border border-neutral-600 text-neutral-400 rounded text-xs hover:text-white"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function TypeToggle({
  value,
  onChange,
}: {
  value: "PREVIEW" | "FINAL";
  onChange: (v: "PREVIEW" | "FINAL") => void;
}) {
  return (
    <div className="flex gap-2">
      {(["PREVIEW", "FINAL"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`flex-1 py-1 rounded text-xs font-semibold transition-colors ${
            value === t
              ? t === "FINAL"
                ? "bg-amber-900/50 border border-amber-700 text-amber-300"
                : "bg-neutral-600 text-white"
              : "bg-neutral-700/50 text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {t === "PREVIEW" ? "Preview / WIP" : "🔒 Final delivery"}
        </button>
      ))}
    </div>
  );
}
