"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SERVICE_TYPES = [
  "Logo Design",
  "Brand Identity",
  "Web Design",
  "Mobile App",
  "Packaging",
  "Social Media",
  "Illustration",
  "Other",
];

const CURRENCIES = ["MAD", "EUR", "USD", "GBP"];

export default function CreateProjectModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    serviceType: "",
    clientName: "",
    clientEmail: "",
    deadline: "",
    totalPrice: "",
    currency: "MAD",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setOpen(false);
      setForm({ title: "", description: "", serviceType: "", clientName: "", clientEmail: "", deadline: "", totalPrice: "", currency: "MAD" });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not create project.");
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 rounded-lg font-semibold text-sm hover:bg-neutral-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Project
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">New Project</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Project Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  placeholder="e.g. Brand Identity — Karim Bakery" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Client Name</label>
                  <input name="clientName" value={form.clientName} onChange={handleChange}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    placeholder="Karim" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Client Email</label>
                  <input name="clientEmail" type="email" value={form.clientEmail} onChange={handleChange}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    placeholder="client@email.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Service Type</label>
                <select name="serviceType" value={form.serviceType} onChange={handleChange}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500">
                  <option value="">Select type...</option>
                  {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 resize-none"
                  placeholder="Brief project description..." />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Total Price</label>
                  <input name="totalPrice" type="number" value={form.totalPrice} onChange={handleChange}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    placeholder="5000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Currency</label>
                  <select name="currency" value={form.currency} onChange={handleChange}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Deadline</label>
                <input name="deadline" type="date" value={form.deadline} onChange={handleChange}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-neutral-700 text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-white text-neutral-900 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50">
                  {loading ? "Creating…" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
