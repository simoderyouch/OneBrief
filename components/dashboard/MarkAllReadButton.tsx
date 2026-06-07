"use client";

import { useRouter } from "next/navigation";

export default function MarkAllReadButton() {
  const router = useRouter();

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={markAll}
      className="text-sm text-neutral-400 hover:text-white"
    >
      Mark all read
    </button>
  );
}
