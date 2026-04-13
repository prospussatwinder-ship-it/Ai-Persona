"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";

export type PersonaFormValues = {
  slug: string;
  name: string;
  isPublished: boolean;
  isActive: boolean;
  visibility: "PUBLIC" | "PRIVATE";
  tagline: string;
  description: string;
  systemPrompt: string;
  avatarUrl: string;
};

const empty: PersonaFormValues = {
  slug: "",
  name: "",
  isPublished: false,
  isActive: true,
  visibility: "PUBLIC",
  tagline: "",
  description: "",
  systemPrompt: "",
  avatarUrl: "",
};

export function PersonaForm({
  mode,
  personaId,
  initial,
}: {
  mode: "create" | "edit";
  personaId?: string;
  initial?: Partial<PersonaFormValues>;
}) {
  const router = useRouter();
  const [v, setV] = useState<PersonaFormValues>({ ...empty, ...initial });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.slug.trim() || !v.name.trim()) {
      toast.error("Slug and name are required.");
      return;
    }
    setBusy(true);
    try {
      const body = {
        slug: v.slug.trim(),
        name: v.name.trim(),
        isPublished: v.isPublished,
        isActive: v.isActive,
        visibility: v.visibility,
        tagline: v.tagline.trim() || undefined,
        description: v.description.trim() || undefined,
        systemPrompt: v.systemPrompt.trim() || undefined,
        avatarUrl: v.avatarUrl.trim() || undefined,
      };
      if (mode === "create") {
        await apiFetch("/v1/admin/personas", { method: "POST", json: body });
        toast.success("Persona created");
        router.push("/admin/personas");
        router.refresh();
      } else if (personaId) {
        await apiFetch(`/v1/admin/personas/${personaId}`, { method: "PATCH", json: body });
        toast.success("Persona updated");
        router.push(`/admin/personas/${personaId}`);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-400">Slug</span>
          <input
            required
            disabled={mode === "edit"}
            value={v.slug}
            onChange={(e) => setV((x) => ({ ...x, slug: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-60"
            placeholder="my-persona"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Name</span>
          <input
            required
            value={v.name}
            onChange={(e) => setV((x) => ({ ...x, name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            checked={v.isActive}
            onChange={(e) => setV((x) => ({ ...x, isActive: e.target.checked }))}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            checked={v.isPublished}
            onChange={(e) => setV((x) => ({ ...x, isPublished: e.target.checked }))}
          />
          Published (browse)
        </label>
        <label className="flex items-center gap-2 text-zinc-300">
          <span className="text-zinc-500">Visibility</span>
          <select
            value={v.visibility}
            onChange={(e) =>
              setV((x) => ({ ...x, visibility: e.target.value as "PUBLIC" | "PRIVATE" }))
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-white"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="text-zinc-400">Avatar URL</span>
        <input
          value={v.avatarUrl}
          onChange={(e) => setV((x) => ({ ...x, avatarUrl: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          placeholder="https://"
        />
      </label>

      <label className="block text-sm">
        <span className="text-zinc-400">Tagline</span>
        <input
          value={v.tagline}
          onChange={(e) => setV((x) => ({ ...x, tagline: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
      </label>

      <label className="block text-sm">
        <span className="text-zinc-400">Description</span>
        <textarea
          value={v.description}
          onChange={(e) => setV((x) => ({ ...x, description: e.target.value }))}
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
      </label>

      <label className="block text-sm">
        <span className="text-zinc-400">System prompt</span>
        <textarea
          value={v.systemPrompt}
          onChange={(e) => setV((x) => ({ ...x, systemPrompt: e.target.value }))}
          rows={6}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-white"
        />
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
