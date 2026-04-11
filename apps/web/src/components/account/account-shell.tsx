"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getToken } from "@/lib/auth";

const links: { href: string; label: string; end?: boolean }[] = [
  { href: "/account", label: "Overview", end: true },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/security", label: "Security" },
  { href: "/account/subscription", label: "Subscription" },
  { href: "/account/usage", label: "Usage" },
];

function active(pathname: string | null, href: string, end?: boolean) {
  if (end) return pathname === "/account";
  return pathname === href || pathname?.startsWith(href + "/");
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!getToken()) {
      router.replace("/login?next=/account");
    }
  }, [loading, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-zinc-400">Loading…</div>
    );
  }

  if (!getToken()) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-zinc-400">Redirecting…</div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-zinc-300">
          Could not load your account. Check that the API is running and{" "}
          <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_API_URL</code> is correct.
        </p>
        <button
          type="button"
          className="mt-4 rounded-lg border border-zinc-600 px-4 py-2 text-zinc-200 hover:bg-zinc-800"
          onClick={() => void refresh()}
        >
          Retry
        </button>
        <Link href="/login?next=/account" className="mt-4 ml-4 inline-block text-violet-400 hover:underline">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="pp-mesh min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:flex lg:gap-10 lg:py-14">
        <aside className="mb-8 shrink-0 lg:mb-0 lg:w-52">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Account</p>
          <nav className="mt-4 flex flex-col gap-1">
            {links.map((l) => {
              const on = active(pathname, l.href, l.end);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    on
                      ? "rounded-lg bg-violet-500/15 px-3 py-2 text-sm font-medium text-violet-200 ring-1 ring-violet-500/25"
                      : "rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900/80 hover:text-white"
                  }
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
