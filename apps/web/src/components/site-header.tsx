"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { clearToken } from "@/lib/auth";

function staffRole(role: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "OPERATOR";
}

const mainNav = [
  { href: "/personas", label: "Personas" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
] as const;

function navClass(pathname: string | null, href: string) {
  const active =
    href === "/personas"
      ? pathname === "/personas" || pathname?.startsWith("/personas/")
      : pathname === href || pathname?.startsWith(href + "/");
  return active ? "text-white" : "text-zinc-400 hover:text-zinc-200";
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const authed = !!user;
  const showAdmin = user ? staffRole(user.role) : false;
  const onAdminRoute = pathname?.startsWith("/admin");

  function logout() {
    clearToken();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/85 shadow-[0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 lg:gap-8">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition group-hover:shadow-violet-800/50">
              P
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">
              Persona<span className="text-violet-400">Platform</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${navClass(pathname, item.href)}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showAdmin && !onAdminRoute ? (
            <Link
              href="/admin/dashboard"
              className="hidden rounded-lg border border-violet-500/35 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20 sm:inline-flex"
            >
              Admin
            </Link>
          ) : null}

          {authed ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <span
                  className="max-w-[140px] truncate text-xs text-zinc-500 lg:max-w-[180px]"
                  title={user?.email ?? undefined}
                >
                  {user?.email}
                </span>
                <Link
                  href="/account"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${navClass(pathname, "/account")}`}
                >
                  Account
                </Link>
              </div>
              <button
                type="button"
                onClick={logout}
                className="hidden rounded-lg border border-zinc-700/90 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white sm:inline-flex"
              >
                Log out
              </button>
            </>
          ) : loading ? (
            <span className="text-xs text-zinc-600">…</span>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  pathname === "/login"
                    ? "border-white text-white"
                    : "border-zinc-600 text-zinc-200 hover:border-zinc-500 hover:text-white"
                }`}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-900/30 transition hover:bg-violet-500"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex flex-col gap-1.5 rounded-lg p-2 text-zinc-300 transition hover:bg-zinc-800/80 lg:hidden"
            aria-expanded={menuOpen}
            aria-label="Open menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="h-0.5 w-5 bg-current" />
            <span className="h-0.5 w-5 bg-current" />
            <span className="h-0.5 w-5 bg-current" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-zinc-800/80 bg-zinc-950/98 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${navClass(pathname, item.href)}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {showAdmin && !onAdminRoute ? (
              <Link
                href="/admin/dashboard"
                className="rounded-lg border border-violet-500/40 px-3 py-2.5 text-sm font-medium text-violet-300"
                onClick={() => setMenuOpen(false)}
              >
                Admin console
              </Link>
            ) : null}
            {authed ? (
              <>
                <Link
                  href="/account"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Account
                </Link>
                <p className="truncate px-3 text-xs text-zinc-500">{user?.email}</p>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-zinc-700 px-3 py-2.5 text-left text-sm text-zinc-200"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2 border-t border-zinc-800 pt-3">
                <Link
                  href="/login"
                  className="rounded-lg border border-zinc-600 py-2.5 text-center text-sm font-medium text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-violet-600 py-2.5 text-center text-sm font-semibold text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
