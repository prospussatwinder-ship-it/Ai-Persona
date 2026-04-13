"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { apiFetch } from "@/lib/auth";

type RecentUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: string;
};

type RecentSub = {
  id: string;
  status: string;
  user: { email: string };
  plan: { name: string; slug: string };
  createdAt: string;
};

type AuditRow = {
  id: string;
  action: string;
  module: string | null;
  entityType: string | null;
  createdAt: string;
  actor: { email: string } | null;
};

type Stats = {
  users: { total: number; active: number; inactive: number; suspended: number };
  roles: number;
  subscriptionPlans: number;
  subscriptions: { active: number; expired: number; trial: number };
  personas?: { total: number; publishedActive: number };
  recentUsers: RecentUser[];
  recentSubscriptions: RecentSub[];
  recentAuditLogs: AuditRow[];
  aiUsageLast30Days: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    apiFetch<Stats>("/v1/admin/dashboard/stats")
      .then((r) => {
        if (!c) setStats(r);
      })
      .catch((e) => {
        if (!c) setError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      c = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }
  if (!stats) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Total users", value: stats.users.total },
    { label: "Active", value: stats.users.active },
    { label: "Inactive", value: stats.users.inactive },
    { label: "Suspended", value: stats.users.suspended },
    { label: "Roles", value: stats.roles },
    { label: "Plans", value: stats.subscriptionPlans },
    { label: "Active subs", value: stats.subscriptions.active },
    { label: "Expired subs", value: stats.subscriptions.expired },
    { label: "Trial subs", value: stats.subscriptions.trial },
    { label: "AI requests (30d)", value: stats.aiUsageLast30Days },
    ...(stats.personas
      ? [
          { label: "Personas", value: stats.personas.total },
          { label: "Published personas", value: stats.personas.publishedActive },
        ]
      : []),
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of users, subscriptions, audit activity, and AI usage."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Overview" }]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Recent users</h3>
            <Link href="/admin/users" className="text-xs text-violet-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {stats.recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                      No users yet
                    </td>
                  </tr>
                ) : (
                  stats.recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-900/30">
                      <td className="px-3 py-2">
                        <Link href={`/admin/users/${u.id}`} className="text-violet-300 hover:underline">
                          {u.email}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-zinc-400">{u.role}</td>
                      <td className="px-3 py-2 text-zinc-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Recent subscriptions</h3>
            <Link href="/admin/user-subscriptions" className="text-xs text-violet-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {stats.recentSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                      No subscriptions yet
                    </td>
                  </tr>
                ) : (
                  stats.recentSubscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-900/30">
                      <td className="px-3 py-2 text-zinc-300">{s.user.email}</td>
                      <td className="px-3 py-2 text-zinc-400">{s.plan.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-zinc-500">{s.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Recent audit events</h3>
          <Link href="/admin/audit-logs" className="text-xs text-violet-400 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {stats.recentAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-zinc-500">
                    No audit entries yet
                  </td>
                </tr>
              ) : (
                stats.recentAuditLogs.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-900/30">
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">{a.actor?.email ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-300">{a.action}</td>
                    <td className="px-3 py-2 text-zinc-500">{a.module ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
