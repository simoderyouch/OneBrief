"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface FileUploadProps {
  projectId: string;
}

export default function FileUpload({ projectId }: FileUploadProps) {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadError(null);
      setSelectedFile(file);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (label) formData.append("label", label);
    if (note) formData.append("note", note);

    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setSelectedFile(null);
      setLabel("");
      setNote("");
      router.refresh();
    } else {
      let message = `Upload failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        /* non-JSON body */
      }
      setUploadError(message);
    }
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragging ? "border-neutral-400 bg-neutral-800" : "border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setUploadError(null);
              setSelectedFile(f);
            }
          }}
        />
        <svg className="w-8 h-8 text-neutral-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {selectedFile ? (
          <p className="text-sm text-white font-medium">{selectedFile.name}</p>
        ) : (
          <p className="text-sm text-neutral-400">Drag & drop or <span className="text-neutral-200 underline">browse</span></p>
        )}
      </div>

      {uploadError && (
        <p className="text-sm text-red-400" role="alert">
          {uploadError}
        </p>
      )}

      {selectedFile && (
        <div className="space-y-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
            placeholder="Label (e.g. Logo — Primary Mark)"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
            placeholder="Version note (optional)"
          />
          <div className="flex gap-2">
            <button onClick={() => { setSelectedFile(null); setUploadError(null); }}
              className="flex-1 py-2 border border-neutral-700 text-neutral-400 rounded-lg text-sm hover:bg-neutral-800 transition-colors">
              Cancel
            </button>
            <button onClick={handleUpload} disabled={uploading}
              className="flex-1 py-2 bg-white text-neutral-900 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50">
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
