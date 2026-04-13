"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { apiFetch } from "@/lib/auth";

type Log = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  module: string | null;
  description: string | null;
  metadata: unknown;
  oldValues: unknown;
  newValues: unknown;
  createdAt: string;
  actor: { id: string; email: string } | null;
};

type ListResponse = {
  total: number;
  limit: number;
  offset: number;
  items: Log[];
};

export default function AuditLogsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Log | null>(null);
  const [q, setQ] = useState({
    search: "",
    module: "",
    action: "",
    from: "",
    to: "",
    offset: 0,
    limit: 40,
  });

  const load = useCallback(() => {
    const params = new URLSearchParams();
    params.set("limit", String(q.limit));
    params.set("offset", String(q.offset));
    if (q.search.trim()) params.set("search", q.search.trim());
    if (q.module.trim()) params.set("module", q.module.trim());
    if (q.action.trim()) params.set("action", q.action.trim());
    if (q.from) params.set("from", q.from);
    if (q.to) params.set("to", q.to);
    setError(null);
    apiFetch<ListResponse>(`/v1/admin/audit-logs?${params.toString()}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Audit log"
        description="Read-only history of administrative actions. Entries cannot be edited or deleted."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Audit log" }]}
      />

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="block text-sm">
          <span className="text-zinc-500">Search</span>
          <input
            value={q.search}
            onChange={(e) => setQ((x) => ({ ...x, search: e.target.value, offset: 0 }))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white lg:w-56"
            placeholder="Action, entity…"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">Module</span>
          <input
            value={q.module}
            onChange={(e) => setQ((x) => ({ ...x, module: e.target.value, offset: 0 }))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white lg:w-36"
            placeholder="users, personas…"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">Action</span>
          <input
            value={q.action}
            onChange={(e) => setQ((x) => ({ ...x, action: e.target.value, offset: 0 }))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white lg:w-36"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">From</span>
          <input
            type="datetime-local"
            value={q.from}
            onChange={(e) => setQ((x) => ({ ...x, from: e.target.value, offset: 0 }))}
            className="mt-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">To</span>
          <input
            type="datetime-local"
            value={q.to}
            onChange={(e) => setQ((x) => ({ ...x, to: e.target.value, offset: 0 }))}
            className="mt-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Apply
        </button>
      </div>

      {!data ? (
        <div className="h-40 animate-pulse rounded-xl bg-zinc-900" />
      ) : (
        <>
          <p className="mb-2 text-xs text-zinc-500">
            Showing {data.items.length} of {data.total}
          </p>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                      No audit entries match your filters.
                    </td>
                  </tr>
                ) : (
                  data.items.map((l) => (
                    <tr key={l.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/30">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs">{l.actor?.email ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                      <td className="px-4 py-3 text-xs">
                        {l.entityType}
                        {l.entityId ? (
                          <span className="text-zinc-600"> · {l.entityId.slice(0, 8)}…</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs">{l.module ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDetail(l)}
                          className="text-xs text-violet-400 hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={q.offset <= 0}
              onClick={() => setQ((x) => ({ ...x, offset: Math.max(0, x.offset - x.limit) }))}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!data || q.offset + data.items.length >= data.total}
              onClick={() => setQ((x) => ({ ...x, offset: x.offset + x.limit }))}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-xl border border-zinc-700 bg-zinc-950 p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-2">
              <h3 className="text-lg font-medium text-white">Audit detail</h3>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="text-zinc-500 hover:text-white"
              >
                Close
              </button>
            </div>
            <dl className="space-y-2 text-sm text-zinc-300">
              <div>
                <dt className="text-xs text-zinc-500">Time</dt>
                <dd>{new Date(detail.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Actor</dt>
                <dd>{detail.actor?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Action</dt>
                <dd className="font-mono text-xs">{detail.action}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Entity</dt>
                <dd>
                  {detail.entityType} {detail.entityId ? `(${detail.entityId})` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Module</dt>
                <dd>{detail.module ?? "—"}</dd>
              </div>
              {detail.description ? (
                <div>
                  <dt className="text-xs text-zinc-500">Description</dt>
                  <dd>{detail.description}</dd>
                </div>
              ) : null}
              {detail.oldValues != null ? (
                <div>
                  <dt className="text-xs text-zinc-500">Old values</dt>
                  <dd>
                    <pre className="mt-1 max-h-40 overflow-auto rounded bg-zinc-900 p-2 text-xs">
                      {JSON.stringify(detail.oldValues, null, 2)}
                    </pre>
                  </dd>
                </div>
              ) : null}
              {detail.newValues != null ? (
                <div>
                  <dt className="text-xs text-zinc-500">New values</dt>
                  <dd>
                    <pre className="mt-1 max-h-40 overflow-auto rounded bg-zinc-900 p-2 text-xs">
                      {JSON.stringify(detail.newValues, null, 2)}
                    </pre>
                  </dd>
                </div>
              ) : null}
              {detail.metadata != null ? (
                <div>
                  <dt className="text-xs text-zinc-500">Metadata</dt>
                  <dd>
                    <pre className="mt-1 max-h-40 overflow-auto rounded bg-zinc-900 p-2 text-xs">
                      {JSON.stringify(detail.metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
