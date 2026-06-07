"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SecurityTier } from "@prisma/client";
import { SECURITY_TIER_LABELS } from "@/lib/file-security";

interface SecurityTierSelectorProps {
  projectId: string;
  currentTier: SecurityTier;
}

const TIERS: SecurityTier[] = ["BASIC", "STANDARD", "PROTECTED"];

export default function SecurityTierSelector({
  projectId,
  currentTier,
}: SecurityTierSelectorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleChange(tier: SecurityTier) {
    if (tier === currentTier) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ securityTier: tier }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-neutral-300">Security tier</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Controls how files are delivered and tracked for this project.
        </p>
      </div>
      <div className="space-y-2">
        {TIERS.map((tier) => {
          const { label, description } = SECURITY_TIER_LABELS[tier];
          const active = tier === currentTier;
          return (
            <button
              key={tier}
              type="button"
              disabled={saving}
              onClick={() => handleChange(tier)}
              className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors disabled:opacity-50 ${
                active
                  ? "border-white/20 bg-neutral-800"
                  : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-white">{label}</span>
                {active && (
                  <span className="text-[10px] uppercase tracking-wide text-neutral-500">Active</span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
