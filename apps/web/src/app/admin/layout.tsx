"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AdminSidebar, buildAdminNav } from "@/components/admin/admin-shell";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { getToken } from "@/lib/auth";

function staffRole(role: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "OPERATOR";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  const allowed = useMemo(() => {
    if (!user) return false;
    return staffRole(user.role) || can(user.permissions, "dashboard.view");
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!getToken()) {
      router.replace("/login?next=/admin/dashboard");
    }
  }, [loading, router]);

  useEffect(() => {
    if (loading || !user) return;
    if (!allowed) {
      router.replace("/account");
    }
  }, [loading, user, allowed, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-zinc-400">
        Checking access…
      </div>
    );
  }

  if (!getToken()) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-zinc-400">
        Redirecting to login…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm">
        <p className="text-zinc-300">
          Could not load your session. Ensure the API is running and{" "}
          <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_API_URL</code> points to it (e.g.{" "}
          <code className="rounded bg-zinc-800 px-1">http://localhost:3001</code>).
        </p>
        <button
          type="button"
          className="mt-4 rounded-lg border border-zinc-600 px-4 py-2 text-zinc-200 hover:bg-zinc-800"
          onClick={() => void refresh()}
        >
          Retry
        </button>
        <Link href="/login?next=/admin/dashboard" className="mt-4 ml-4 inline-block text-violet-400 hover:underline">
          Log in again
        </Link>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  const nav = buildAdminNav(user.permissions, user.role);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-zinc-950">
      <AdminSidebar groups={nav} />

      <div className="min-w-0 lg:pl-60">
        <div className="border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="truncate text-xs text-zinc-500">
              {user.email ? <span className="text-zinc-400">{user.email}</span> : null}
              {user.email ? " · " : null}
              <span className="font-mono text-zinc-500">{user.role}</span>
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-zinc-500 transition hover:text-white">
                Site
              </Link>
              <Link href="/account" className="text-zinc-500 transition hover:text-white">
                Account
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
