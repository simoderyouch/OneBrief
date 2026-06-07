"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Package = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  files: { id: string; label: string | null; versionNumber: number }[];
};

export default function PackageManager({
  projectId,
  packages: initial,
}: {
  projectId: string;
  packages: Package[];
}) {
  const router = useRouter();
  const [packages, setPackages] = useState(initial);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function createPackage() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      const pkg = await res.json();
      setPackages([...packages, { ...pkg, files: [] }]);
      setName("");
      router.refresh();
    }
    setLoading(false);
  }

  async function removePackage(packageId: string) {
    if (!confirm("Remove this package? Files will be unassigned.")) return;
    await fetch(`/api/projects/${projectId}/packages/${packageId}`, { method: "DELETE" });
    setPackages(packages.filter((p) => p.id !== packageId));
    router.refresh();
  }

  return (
    <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <h2 className="font-semibold text-white mb-4">Deliverable packages</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Package name (e.g. Final brand kit)"
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={createPackage}
          disabled={loading}
          className="px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {packages.length === 0 ? (
        <p className="text-sm text-neutral-500">Group files into packages for clients.</p>
      ) : (
        <ul className="space-y-3">
          {packages.map((pkg) => (
            <li
              key={pkg.id}
              className="border border-neutral-800 rounded-lg p-3 flex justify-between gap-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{pkg.name}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {pkg.files.length} file{pkg.files.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removePackage(pkg.id)}
                className="text-xs text-neutral-500 hover:text-neutral-300"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
