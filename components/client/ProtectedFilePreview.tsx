"use client";

import { useEffect, useState } from "react";

interface ProtectedFilePreviewProps {
  imageUrl: string;
  watermarkText: string;
  fileLabel: string;
}

export default function ProtectedFilePreview({
  imageUrl,
  watermarkText,
  fileLabel,
}: ProtectedFilePreviewProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(imageUrl, { credentials: "include" });
        if (!res.ok) {
          setError(true);
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl]);

  if (error) {
    return (
      <div className="panel p-8 text-center text-neutral-500 text-sm">
        Could not load preview. The link may have expired or access was denied.
      </div>
    );
  }

  if (!src) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-16 text-center text-neutral-500 text-sm">
        Loading preview…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={fileLabel}
          className="w-full max-h-[70vh] object-contain mx-auto pointer-events-none"
          draggable={false}
        />
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -35deg,
                transparent,
                transparent 80px,
                rgba(255,255,255,0.4) 80px,
                rgba(255,255,255,0.4) 81px
              )`,
            }}
          />
          <p
            className="text-white/25 font-bold text-2xl sm:text-4xl tracking-widest uppercase rotate-[-25deg] whitespace-nowrap"
            style={{ textShadow: "0 0 20px rgba(0,0,0,0.5)" }}
          >
            {watermarkText}
          </p>
        </div>
      </div>
      <p className="text-xs text-neutral-500 text-center max-w-md mx-auto">
        Watermarked preview — work in progress. Download is disabled until your designer marks this
        file as final or enables download.
      </p>
    </div>
  );
}
