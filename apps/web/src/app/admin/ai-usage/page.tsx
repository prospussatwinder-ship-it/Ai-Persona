"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/auth";

type Summary = {
  windowDays: number;
  since: string;
  totalRequests: number;
  successful: number;
  errors: number;
  byFeature: { featureName: string; count: number }[];
};

type LogRow = {
  id: string;
  featureName: string;
  requestType: string;
  creditsUsed: number;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  status: string;
  createdAt: string;
  user: { email: string };
  subscription: {
    id: string;
    plan: { name: string; slug: string };
  } | null;
};

type ListRes = {
  total: number;
  limit: number;
  offset: number;
  items: LogRow[];
};

export default function AdminAiUsagePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [list, setList] = useState<ListRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, l] = await Promise.all([
        apiFetch<Summary>("/v1/admin/ai-usage/summary"),
        apiFetch<ListRes>(`/v1/admin/ai-usage?limit=${limit}&offset=${offset}`),
      ]);
      setSummary(s);
      setList(l);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError("You do not have permission to view AI usage (ai_usage.view).");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    }
  }, [offset]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div>
        <AdminPageHeader title="AI usage" description="Request logs and quotas across features." />
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!summary || !list) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded bg-zinc-800" />
        <div className="h-32 animate-pulse rounded-xl bg-zinc-900" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="AI usage"
        description="Per-request logs, token counts, and 30-day rollups by feature."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "AI usage" },
        ]}
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-xs uppercase text-zinc-500">Requests ({summary.windowDays}d)</p>
          <p className="mt-1 text-2xl font-semibold text-white">{summary.totalRequests}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-xs uppercase text-zinc-500">Successful</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">{summary.successful}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-xs uppercase text-zinc-500">Errors / other</p>
          <p className="mt-1 text-2xl font-semibold text-amber-400">{summary.errors}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-xs uppercase text-zinc-500">Top features</p>
          <p className="mt-1 text-sm text-zinc-300">
            {summary.byFeature.slice(0, 2).map((x) => (
              <span key={x.featureName} className="mr-2 block font-mono text-xs">
                {x.featureName}: {x.count}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Feature</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Tokens</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {list.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-zinc-500">
                  No AI usage recorded yet. Chat with a persona to generate entries.
                </td>
              </tr>
            ) : (
              list.items.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-900/30">
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-zinc-300">{row.user.email}</td>
                  <td className="px-3 py-2 font-mono text-xs text-violet-300">{row.featureName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-500">{row.requestType}</td>
                  <td className="px-3 py-2 text-zinc-400">
                    {row.totalTokens ?? row.promptTokens ?? row.completionTokens ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-400">{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {list.total > limit ? (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>
            Showing {list.offset + 1}–{Math.min(list.offset + list.items.length, list.total)} of{" "}
            {list.total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={offset === 0}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-300 disabled:opacity-40"
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={offset + limit >= list.total}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-300 disabled:opacity-40"
              onClick={() => setOffset((o) => o + limit)}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
