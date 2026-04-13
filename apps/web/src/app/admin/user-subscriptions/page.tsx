"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth";

type Row = {
  id: string;
  status: string;
  user: { email: string };
  plan: { name: string; slug: string };
  createdAt: string;
};

export default function UserSubscriptionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    apiFetch<Row[]>("/v1/admin/user-subscriptions")
      .then((r) => {
        if (!c) setRows(r);
      })
      .catch((e) => {
        if (!c) setError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      c = true;
    };
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-medium text-white">User subscriptions</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-left text-sm text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800/80">
                <td className="px-4 py-3">{r.user.email}</td>
                <td className="px-4 py-3">
                  {r.plan.name}{" "}
                  <span className="text-xs text-zinc-500">({r.plan.slug})</span>
                </td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
