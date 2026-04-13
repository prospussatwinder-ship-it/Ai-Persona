"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function staffRole(role: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "OPERATOR";
}

export default function AccountOverviewPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <div className="border-b border-zinc-800/80 pb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Overview</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Signed in as <span className="text-zinc-200">{user.email}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="muted">{user.role}</Badge>
          {user.ageVerified ? (
            <Badge variant="success">Age verified</Badge>
          ) : (
            <Badge variant="warning">Age pending</Badge>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/account/profile">
          <Card className="h-full transition hover:border-violet-500/30">
            <CardTitle>Profile</CardTitle>
            <CardDescription>Name, avatar, and contact details.</CardDescription>
            <p className="mt-4 text-sm font-medium text-violet-400">Manage →</p>
          </Card>
        </Link>
        <Link href="/account/security">
          <Card className="h-full transition hover:border-violet-500/30">
            <CardTitle>Security</CardTitle>
            <CardDescription>Password and sign-in hygiene.</CardDescription>
            <p className="mt-4 text-sm font-medium text-violet-400">Manage →</p>
          </Card>
        </Link>
        <Link href="/account/subscription">
          <Card className="h-full transition hover:border-violet-500/30">
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Plan, renewal, and billing portal (when connected).</CardDescription>
            <p className="mt-4 text-sm font-medium text-violet-400">View →</p>
          </Card>
        </Link>
        <Link href="/account/usage">
          <Card className="h-full transition hover:border-violet-500/30">
            <CardTitle>Usage</CardTitle>
            <CardDescription>How you use personas and AI features.</CardDescription>
            <p className="mt-4 text-sm font-medium text-violet-400">View →</p>
          </Card>
        </Link>
      </div>

      <dl className="mt-10 grid gap-4 rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Member since</dt>
          <dd className="mt-1 text-white">
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Last login</dt>
          <dd className="mt-1 text-white">
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
          </dd>
        </div>
      </dl>

      {staffRole(user.role) ? (
        <Link
          href="/admin/dashboard"
          className="mt-10 inline-flex rounded-xl border border-violet-500/40 bg-violet-500/10 px-5 py-3 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
        >
          Open admin console →
        </Link>
      ) : null}
    </div>
  );
}
