"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-neutral-500 tracking-wider uppercase mb-1">{PRODUCT_NAME}</p>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-neutral-400 mt-1 text-sm">Set up your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Nickname or studio name <span className="text-neutral-500 font-normal">(optional)</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
              placeholder="e.g. Northbound Studio"
              autoComplete="nickname"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
              placeholder="you@studio.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
              placeholder="Min. 8 characters"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-white text-neutral-900 font-semibold rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-neutral-300 hover:text-white transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
