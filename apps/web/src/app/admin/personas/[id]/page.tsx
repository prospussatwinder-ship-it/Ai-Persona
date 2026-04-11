"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { apiFetch } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";

type PersonaDetail = {
  id: string;
  slug: string;
  name: string;
  isPublished: boolean;
  isActive: boolean;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; email: string } | null;
  profile: {
    tagline: string | null;
    description: string | null;
    systemPrompt: string | null;
    avatarUrl: string | null;
  } | null;
  _count: { conversations: number };
};

function Badge({ children, tone }: { children: React.ReactNode; tone: "ok" | "warn" | "muted" }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-500/15 text-emerald-200"
      : tone === "warn"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-zinc-800 text-zinc-400";
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export default function PersonaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const p = user?.permissions;
  const staff =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "OPERATOR";

  const canEdit = staff || can(p, "personas.edit");
  const canPublish = staff || can(p, "personas.publish");
  const canDelete = staff || can(p, "personas.delete");

  const [persona, setPersona] = useState<PersonaDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!id) return;
    apiFetch<PersonaDetail>(`/v1/admin/personas/${id}`)
      .then(setPersona)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function togglePublish() {
    if (!persona) return;
    setBusy("pub");
    try {
      await apiFetch(`/v1/admin/personas/${id}/publish`, {
        method: "PATCH",
        json: { isPublished: !persona.isPublished },
      });
      toast.success(persona.isPublished ? "Unpublished" : "Published");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!persona) return;
    if (
      !window.confirm(
        `Delete persona “${persona.name}”? This cannot be undone if there are no conversations.`
      )
    ) {
      return;
    }
    setBusy("del");
    try {
      await apiFetch(`/v1/admin/personas/${id}`, { method: "DELETE" });
      toast.success("Persona deleted");
      router.push("/admin/personas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!persona) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-56 animate-pulse rounded bg-zinc-800" />
        <div className="h-40 animate-pulse rounded-xl bg-zinc-900" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={persona.name}
        description={persona.profile?.tagline ?? persona.slug}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Personas", href: "/admin/personas" },
          { label: persona.name },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Link
                href={`/admin/personas/${id}/edit`}
                className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
              >
                Edit
              </Link>
            ) : null}
            {canPublish ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void togglePublish()}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {busy === "pub" ? "…" : persona.isPublished ? "Unpublish" : "Publish"}
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void remove()}
                className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950/60 disabled:opacity-50"
              >
                {busy === "del" ? "…" : "Delete"}
              </button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={persona.isActive ? "ok" : "warn"}>
              {persona.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge tone={persona.isPublished ? "ok" : "muted"}>
              {persona.isPublished ? "Published" : "Draft"}
            </Badge>
            <Badge tone="muted">{persona.visibility}</Badge>
          </div>
          <p className="font-mono text-xs text-zinc-500">{persona.slug}</p>
          {persona.profile?.description ? (
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{persona.profile.description}</p>
          ) : null}
          {persona.profile?.systemPrompt ? (
            <div>
              <h4 className="text-xs font-medium uppercase text-zinc-500">System prompt</h4>
              <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                {persona.profile.systemPrompt}
              </pre>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 text-sm">
          <h4 className="text-xs font-medium uppercase text-zinc-500">Metadata</h4>
          <dl className="space-y-2 text-zinc-400">
            <div>
              <dt className="text-zinc-600">Conversations</dt>
              <dd className="font-mono text-zinc-300">{persona._count.conversations}</dd>
            </div>
            <div>
              <dt className="text-zinc-600">Created</dt>
              <dd>{new Date(persona.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-zinc-600">Updated</dt>
              <dd>{new Date(persona.updatedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-zinc-600">Created by</dt>
              <dd>{persona.createdBy?.email ?? "—"}</dd>
            </div>
          </dl>
          {persona.profile?.avatarUrl ? (
            <div>
              <p className="text-xs text-zinc-600">Avatar</p>
              {/* External avatar URLs — avoid next/image domain allowlist */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={persona.profile.avatarUrl}
                alt=""
                className="mt-2 max-h-40 rounded-lg border border-zinc-800"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
