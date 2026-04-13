"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { apiFetch } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";

type Role = {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  permissions: { permission: { id: string; slug: string; module: string; name: string } }[];
  _count: { permissions: number };
};

type PermRow = { id: string; slug: string; module: string; name: string };

export default function AdminRolesPage() {
  const { user } = useAuth();
  const p = user?.permissions;
  const staff =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "OPERATOR";
  const canEdit = staff || can(p, "roles.edit");

  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      apiFetch<Role[]>("/v1/admin/roles"),
      apiFetch<PermRow[]>("/v1/admin/permissions"),
    ])
      .then(([r, permList]) => {
        setRoles(r);
        setPerms(permList);
        setSelectedId((prev) => prev ?? (r[0]?.id ?? null));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = roles.find((x) => x.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    setChecked(new Set(selected.permissions.map((rp) => rp.permission.id)));
  }, [selected]);

  const byModule = useMemo(() => {
    const m = new Map<string, PermRow[]>();
    for (const row of perms) {
      const k = row.module || "other";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(row);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.slug.localeCompare(b.slug));
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [perms]);

  async function save() {
    if (!selectedId || !canEdit || !selected) return;
    if (selected.slug === "super_admin") {
      toast.error("The super_admin role is protected.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/v1/admin/roles/${selectedId}/permissions`, {
        method: "PUT",
        json: { permissionIds: [...checked] },
      });
      toast.success("Permissions saved");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div>
      <AdminPageHeader
        title="Roles & permissions"
        description="Assign permission slugs to each role. System roles can be restricted from destructive changes in the API."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Roles" }]}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="block text-sm">
          <span className="text-zinc-500">Role</span>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="mt-1 block rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.slug}) · {r._count.permissions} perms
                {r.isSystem ? " · system" : ""}
              </option>
            ))}
          </select>
        </label>
        {canEdit && selected && selected.slug !== "super_admin" ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="self-end rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save permissions"}
          </button>
        ) : null}
        {selected?.slug === "super_admin" ? (
          <p className="self-end text-xs text-amber-200/90">
            The super_admin permission set is fixed in the UI to avoid lockouts.
          </p>
        ) : selected?.isSystem ? (
          <p className="self-end text-xs text-zinc-500">System role — edit carefully.</p>
        ) : null}
      </div>

      {selected ? (
        <div className="space-y-8">
          {byModule.map(([module, rows]) => (
            <section key={module}>
              <h3 className="mb-3 text-sm font-medium capitalize text-zinc-400">{module}</h3>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((perm) => {
                  const on = checked.has(perm.id);
                  return (
                    <li
                      key={perm.id}
                      className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={on}
                        disabled={!canEdit || selected.slug === "super_admin"}
                        onChange={(e) => {
                          setChecked((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(perm.id);
                            else next.delete(perm.id);
                            return next;
                          });
                        }}
                      />
                      <div>
                        <p className="font-mono text-xs text-violet-300">{perm.slug}</p>
                        <p className="text-xs text-zinc-500">{perm.name}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No roles loaded.</p>
      )}
    </div>
  );
}
