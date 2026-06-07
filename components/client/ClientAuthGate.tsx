"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnebriefLogo from "./OnebriefLogo";
import FreelancerBadge from "./FreelancerBadge";

export default function ClientAuthGate({
  token,
  projectTitle,
  freelancerName,
  freelancerAvatarUrl,
}: {
  token: string;
  projectTitle: string;
  freelancerName: string;
  freelancerAvatarUrl?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/client/${token}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
      return;
    }
    try {
      const d = (await res.json()) as { error?: string };
      setError(d.error || "Could not create account");
    } catch {
      setError("Could not create account");
    }
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/client/${token}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
      return;
    }
    try {
      const d = (await res.json()) as { error?: string };
      setError(d.error || "Could not sign in");
    } catch {
      setError("Could not sign in");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <OnebriefLogo size="lg" />
          <span className="text-[10px] text-neutral-500 shrink-0">Private link</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white text-balance">
            {projectTitle}
          </h1>
          <FreelancerBadge name={freelancerName} avatarUrl={freelancerAvatarUrl} />
          <p className="text-sm text-neutral-400 max-w-xl">
            Sign in or create a portal account for this project. Your email is used for notifications about quotes and
            updates. One account per project link.
          </p>
        </div>

        <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex rounded-lg bg-neutral-800/80 p-0.5">
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "register" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Sign in
            </button>
          </div>

          {mode === "register" ? (
            <form onSubmit={submitRegister} className="space-y-3">
              <div>
                <label htmlFor="portal-fullname" className="block text-xs font-medium text-neutral-400 mb-1">
                  Full name
                </label>
                <input
                  id="portal-fullname"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label htmlFor="portal-email-reg" className="block text-xs font-medium text-neutral-400 mb-1">
                  Email
                </label>
                <input
                  id="portal-email-reg"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label htmlFor="portal-password-reg" className="block text-xs font-medium text-neutral-400 mb-1">
                  Password
                </label>
                <input
                  id="portal-password-reg"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
                <p className="text-[10px] text-neutral-600 mt-1">At least 8 characters.</p>
              </div>
              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-white text-neutral-900 font-semibold rounded-lg text-sm hover:bg-neutral-100 disabled:opacity-50"
              >
                {loading ? "…" : "Create account & continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitLogin} className="space-y-3">
              <div>
                <label htmlFor="portal-email-in" className="block text-xs font-medium text-neutral-400 mb-1">
                  Email
                </label>
                <input
                  id="portal-email-in"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label htmlFor="portal-password-in" className="block text-xs font-medium text-neutral-400 mb-1">
                  Password
                </label>
                <input
                  id="portal-password-in"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-white text-neutral-900 font-semibold rounded-lg text-sm hover:bg-neutral-100 disabled:opacity-50"
              >
                {loading ? "…" : "Sign in"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
