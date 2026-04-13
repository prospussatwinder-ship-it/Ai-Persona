"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { apiFetch } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";

type PersonaAdmin = {
  id: string;
  slug: string;
  name: string;
  isPublished: boolean;
  isActive: boolean;
  visibility: string;
  updatedAt: string;
  createdBy: { email: string } | null;
  profile: { tagline: string | null; avatarUrl: string | null } | null;
  _count: { conversations: number };
};

export default function AdminPersonasPage() {
  const { user } = useAuth();
  const p = user?.permissions;
  const staff =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "OPERATOR";

  const canView = staff || can(p, "personas.view");
  const canCreate = staff || can(p, "personas.create");
  const canEdit = staff || can(p, "personas.edit");
  const canPublish = staff || can(p, "personas.publish");
  const canDelete = staff || can(p, "personas.delete");

  const [personas, setPersonas] = useState<PersonaAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [vis, setVis] = useState<"all" | "PUBLIC" | "PRIVATE">("all");
  const [pub, setPub] = useState<"all" | "pub" | "draft">("all");

  function reload() {
    apiFetch<{ personas: PersonaAdmin[] }>("/v1/admin/personas")
      .then((r) => {
        setPersonas(r.personas);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }

  useEffect(() => {
    if (!canView) return;
    reload();
  }, [canView]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return personas.filter((row) => {
      if (t) {
        const hay = `${row.name} ${row.slug} ${row.profile?.tagline ?? ""}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      if (status === "active" && !row.isActive) return false;
      if (status === "inactive" && row.isActive) return false;
      if (vis !== "all" && row.visibility !== vis) return false;
      if (pub === "pub" && !row.isPublished) return false;
      if (pub === "draft" && row.isPublished) return false;
      return true;
    });
  }, [personas, q, status, vis, pub]);

  async function togglePublish(id: string, isPublished: boolean) {
    setBusy(id);
    try {
      await apiFetch(`/v1/admin/personas/${id}/publish`, {
        method: "PATCH",
        json: { isPublished: !isPublished },
      });
      toast.success(!isPublished ? "Published" : "Unpublished");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, name: string) {
    if (
      !window.confirm(
        `Delete persona “${name}”? Only allowed when there are no conversations.`
      )
    ) {
      return;
    }
    setBusy(id);
    try {
      await apiFetch(`/v1/admin/personas/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  if (!canView) {
    return (
      <p className="text-sm text-zinc-500">
        You do not have permission to view personas.
      </p>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Personas"
        description="Manage AI personas: publish state, visibility, and prompts."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Personas" }]}
        actions={
          canCreate ? (
            <Link
              href="/admin/personas/new"
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
            >
              New persona
            </Link>
          ) : null
        }
      />

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="block text-sm">
          <span className="text-zinc-500">Search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-1 w-full min-w-[12rem] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white sm:w-64"
            placeholder="Name, slug…"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="mt-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">Visibility</span>
          <select
            value={vis}
            onChange={(e) => setVis(e.target.value as typeof vis)}
            className="mt-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">Publish</span>
          <select
            value={pub}
            onChange={(e) => setPub(e.target.value as typeof pub)}
            className="mt-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="pub">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-left text-sm text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Persona</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Chats</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No personas match filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/personas/${row.id}`}
                      className="font-medium text-violet-300 hover:underline"
                    >
                      {row.name}
                    </Link>
                    <p className="font-mono text-xs text-zinc-500">{row.slug}</p>
                    {row.profile?.tagline ? (
                      <p className="text-xs text-zinc-500">{row.profile.tagline}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={
                          row.isActive
                            ? "rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs text-emerald-200"
                            : "rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400"
                        }
                      >
                        {row.isActive ? "active" : "inactive"}
                      </span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                        {row.visibility}
                      </span>
                      <span
                        className={
                          row.isPublished
                            ? "rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-200"
                            : "rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500"
                        }
                      >
                        {row.isPublished ? "published" : "draft"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                    {row._count.conversations}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(row.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/admin/personas/${row.id}`}
                        className="text-xs text-violet-400 hover:underline"
                      >
                        View
                      </Link>
                      {canEdit ? (
                        <Link
                          href={`/admin/personas/${row.id}/edit`}
                          className="text-xs text-zinc-400 hover:underline"
                        >
                          Edit
                        </Link>
                      ) : null}
                      {canPublish ? (
                        <button
                          type="button"
                          disabled={busy === row.id}
                          onClick={() => void togglePublish(row.id, row.isPublished)}
                          className="text-xs text-amber-300 hover:underline disabled:opacity-50"
                        >
                          {busy === row.id ? "…" : row.isPublished ? "Unpublish" : "Publish"}
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          disabled={busy === row.id}
                          onClick={() => void remove(row.id, row.name)}
                          className="text-xs text-red-400 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
