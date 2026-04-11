"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { apiFetch } from "@/lib/auth";
import { StatCard } from "@/components/ui/stat-card";

type Stats = {
  users: { total: number; active: number; inactive: number; suspended: number };
  roles: number;
  subscriptionPlans: number;
  subscriptions: { active: number; expired: number; trial: number };
  personas?: { total: number; publishedActive: number };
  aiUsageLast30Days: number;
};

export default function AdminReportsPage() {
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

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!stats) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-zinc-800" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Reports"
        description="High-level operational metrics from the same data as the dashboard. Export and scheduled reports can plug in later."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Reports" }]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total users" value={stats.users.total} />
        <StatCard label="Active users" value={stats.users.active} />
        <StatCard label="Suspended" value={stats.users.suspended} />
        <StatCard label="Roles configured" value={stats.roles} />
        <StatCard label="Subscription plans" value={stats.subscriptionPlans} />
        <StatCard label="Active subscriptions" value={stats.subscriptions.active} />
        <StatCard label="Expired subscriptions" value={stats.subscriptions.expired} />
        <StatCard label="Trial subscriptions" value={stats.subscriptions.trial} />
        <StatCard label="AI requests (30d)" value={stats.aiUsageLast30Days} />
        {stats.personas ? (
          <>
            <StatCard label="Personas" value={stats.personas.total} />
            <StatCard label="Published personas" value={stats.personas.publishedActive} />
          </>
        ) : null}
      </div>

      <p className="mt-10 text-sm text-zinc-500">
        For detailed logs and filters, open{" "}
        <Link href="/admin/audit-logs" className="text-violet-400 hover:underline">
          Audit log
        </Link>{" "}
        or{" "}
        <Link href="/admin/ai-usage" className="text-violet-400 hover:underline">
          AI usage
        </Link>
        .
      </p>
    </div>
  );
}
