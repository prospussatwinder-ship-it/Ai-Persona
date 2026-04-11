"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth";

type PersonaAdmin = {
  id: string;
  slug: string;
  name: string;
  isPublished: boolean;
  _count: { conversations: number };
};

export default function AdminPersonasPage() {
  const [personas, setPersonas] = useState<PersonaAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function reload() {
    apiFetch<{ personas: PersonaAdmin[] }>("/v1/admin/personas")
      .then((r) => setPersonas(r.personas))
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }

  useEffect(() => {
    reload();
  }, []);

  async function togglePublish(id: string, isPublished: boolean) {
    setBusy(id);
    setError(null);
    try {
      await apiFetch(`/v1/admin/personas/${id}/publish`, {
        method: "PATCH",
        json: { isPublished: !isPublished },
      });
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-white">Personas</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Toggle public visibility for the browse directory.
      </p>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <ul className="mt-6 space-y-3">
        {personas.map((p) => (
          <li
            key={p.id}
            className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 sm:flex-row sm:items-center"
          >
            <div>
              <p className="font-medium text-white">{p.name}</p>
              <p className="font-mono text-xs text-zinc-500">
                {p.slug} · {p._count.conversations} conversations
              </p>
            </div>
            <button
              type="button"
              disabled={busy === p.id}
              onClick={() => void togglePublish(p.id, p.isPublished)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                p.isPublished
                  ? "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
              } disabled:opacity-50`}
            >
              {busy === p.id ? "…" : p.isPublished ? "Unpublish" : "Publish"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
