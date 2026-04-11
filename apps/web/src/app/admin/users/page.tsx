"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth";

type Row = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [data, setData] = useState<{ total: number; users: Row[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let c = false;
    const q = new URLSearchParams();
    if (search.trim()) q.set("search", search.trim());
    apiFetch<{ total: number; users: Row[] }>(`/v1/admin/users?${q.toString()}`)
      .then((r) => {
        if (!c) setData(r);
      })
      .catch((e) => {
        if (!c) setError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      c = true;
    };
  }, [search]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-white">Users</h2>
        <div className="flex gap-2">
          <input
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white"
            placeholder="Search email or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link
            href="/admin/users/new"
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white hover:bg-violet-500"
          >
            New user
          </Link>
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {data ? (
        <p className="mt-2 text-xs text-zinc-500">Total: {data.total}</p>
      ) : null}
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-left text-sm text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-zinc-800/80">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-violet-400 hover:underline"
                  >
                    {u.email}
                  </Link>
                </td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.status}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {new Date(u.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
