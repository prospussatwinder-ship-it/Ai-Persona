"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth";
import Link from "next/link";

type UserRow = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  ageVerified: boolean;
  createdAt: string;
};

export default function AdminHomePage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ users: UserRow[] }>("/v1/admin/users")
      .then((r) => {
        if (!cancelled) setUsers(r.users);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load users");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h2 className="text-lg font-medium text-white">Recent users</h2>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-left text-sm text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Age ✓</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-800/80">
                <td className="px-4 py-3 font-mono text-xs text-zinc-400">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.ageVerified ? "yes" : "—"}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {new Date(u.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-zinc-500">
        Manage persona visibility on the{" "}
        <Link href="/admin/personas" className="text-violet-400 hover:underline">
          Personas
        </Link>{" "}
        tab.
      </p>
    </div>
  );
}
