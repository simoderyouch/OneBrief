"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface SettingsFormProps {
  user: {
    name: string | null;
    nickname: string | null;
    email: string;
    notifyFeedback: boolean;
    notifyUpload: boolean;
    notifyStatus: boolean;
    whatsappDefaultCountryCode: string;
    ribAccountHolder: string | null;
    ribIban: string | null;
    ribBic: string | null;
    ribBankName: string | null;
  };
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const { update } = useSession();
  const [nickname, setNickname] = useState(user.nickname?.trim() || user.name?.trim() || "");
  const [whatsappCountryCode, setWhatsappCountryCode] = useState(
    user.whatsappDefaultCountryCode || "212"
  );
  const [notifyFeedback, setNotifyFeedback] = useState(user.notifyFeedback);
  const [notifyUpload, setNotifyUpload] = useState(user.notifyUpload);
  const [notifyStatus, setNotifyStatus] = useState(user.notifyStatus);

  const [ribAccountHolder, setRibAccountHolder] = useState(user.ribAccountHolder || "");
  const [ribIban, setRibIban] = useState(user.ribIban || "");
  const [ribBic, setRibBic] = useState(user.ribBic || "");
  const [ribBankName, setRibBankName] = useState(user.ribBankName || "");
  const [ribSaving, setRibSaving] = useState(false);
  const [ribSaved, setRibSaved] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    setProfileError(null);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, whatsappDefaultCountryCode: whatsappCountryCode }),
    });
    setProfileSaving(false);
    if (!res.ok) {
      try {
        const body = (await res.json()) as { error?: string };
        setProfileError(body.error || "Could not save profile");
      } catch {
        setProfileError("Could not save profile");
      }
      return;
    }
    const trimmed = nickname.trim();
    await update({ name: trimmed || null });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  async function saveRib() {
    setRibSaving(true);
    setRibSaved(false);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ribAccountHolder, ribIban, ribBic, ribBankName }),
    });
    setRibSaving(false);
    setRibSaved(true);
    setTimeout(() => setRibSaved(false), 3000);
  }

  async function saveNotifications() {
    setNotifSaving(true);
    setNotifSaved(false);
    await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifyFeedback, notifyUpload, notifyStatus }),
    });
    setNotifSaving(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Nickname or studio name
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              Shown to clients on shared project pages and in notification emails. You can change it anytime.
            </p>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-all"
              placeholder="e.g. Northbound Studio"
              maxLength={120}
              autoComplete="nickname"
            />
          </div>

          {profileError && (
            <p className="text-sm text-neutral-500" role="alert">
              {profileError}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Default WhatsApp country code
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              Used when client numbers start with 0 (e.g. 0612345678 → +212…). Morocco: 212.
            </p>
            <input
              value={whatsappCountryCode}
              onChange={(e) => setWhatsappCountryCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full max-w-[120px] px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
              placeholder="212"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
            <input
              value={user.email}
              readOnly
              disabled
              className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-800 rounded-lg text-neutral-500 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-4 py-2 bg-white text-neutral-900 font-semibold rounded-lg text-sm hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              {profileSaving ? "Saving…" : "Save profile"}
            </button>
            {profileSaved && (
              <span className="text-sm text-neutral-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Bank details / RIB */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-1">Payment details (RIB)</h2>
        <p className="text-xs text-neutral-500 mb-4">
          Shown on invoices so clients know where to send payment. Never shared elsewhere.
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Account holder</label>
              <input
                value={ribAccountHolder}
                onChange={(e) => setRibAccountHolder(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Bank name</label>
              <input
                value={ribBankName}
                onChange={(e) => setRibBankName(e.target.value)}
                placeholder="e.g. CIH Bank"
                className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">IBAN</label>
            <input
              value={ribIban}
              onChange={(e) => setRibIban(e.target.value)}
              placeholder="MA64 0000 0000 0000 0000 0000 000"
              className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 font-mono tracking-wider"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">BIC / SWIFT</label>
            <input
              value={ribBic}
              onChange={(e) => setRibBic(e.target.value.toUpperCase())}
              placeholder="CIHBMAMR"
              maxLength={11}
              className="w-full max-w-[200px] px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 font-mono"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={saveRib}
            disabled={ribSaving}
            className="px-4 py-2 bg-white text-neutral-900 font-semibold rounded-lg text-sm hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            {ribSaving ? "Saving…" : "Save payment details"}
          </button>
          {ribSaved && (
            <span className="text-sm text-neutral-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">In-app notifications</h2>
        <div className="space-y-4">
          <Toggle
            label="New feedback from client"
            description="Get notified when your client submits feedback"
            checked={notifyFeedback}
            onChange={setNotifyFeedback}
          />
          <Toggle
            label="File version uploaded"
            description="Get notified when a new file version is available"
            checked={notifyUpload}
            onChange={setNotifyUpload}
          />
          <Toggle
            label="Project status changes"
            description="Notify client when project status is updated"
            checked={notifyStatus}
            onChange={setNotifyStatus}
          />
        </div>

        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-neutral-800">
          <button
            onClick={saveNotifications}
            disabled={notifSaving}
            className="px-4 py-2 bg-white text-neutral-900 font-semibold rounded-lg text-sm hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            {notifSaving ? "Saving…" : "Save preferences"}
          </button>
          {notifSaved && (
            <span className="text-sm text-neutral-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-neutral-200">{label}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-white" : "bg-neutral-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-neutral-900 rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
