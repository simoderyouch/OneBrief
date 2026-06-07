"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientPortalBar({ token, fullName }: { token: string; fullName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch(`/api/client/${token}/logout`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="border-b border-neutral-800/80 bg-neutral-900/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
        <span>
          Signed in as <span className="text-neutral-200 font-medium">{fullName}</span>
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loading}
          className="text-neutral-500 hover:text-neutral-300 underline-offset-2 hover:underline disabled:opacity-50"
        >
          {loading ? "…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
