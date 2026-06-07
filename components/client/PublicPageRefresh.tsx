"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Soft “realtime”: refresh server content periodically while the tab is visible. */
export default function PublicPageRefresh({ intervalMs = 45000 }: { intervalMs?: number }) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        router.refresh();
      }
    };
    intervalRef.current = setInterval(tick, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router, intervalMs]);

  return null;
}
