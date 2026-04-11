"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, getToken } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<"check" | "yes" | "no">("check");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    apiFetch<{ role: string }>("/v1/auth/me")
      .then((u) => {
        if (cancelled) return;
        const ok = u.role === "ADMIN" || u.role === "OPERATOR";
        setAllowed(ok ? "yes" : "no");
        if (!ok) router.replace("/account");
      })
      .catch(() => {
        if (!cancelled) setAllowed("no");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (allowed === "check") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-zinc-400">Checking access…</div>
    );
  }

  if (allowed === "no") {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Admin</h1>
          <p className="text-sm text-zinc-500">Personas, publishing, and recent signups</p>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/admin"
            className={pathname === "/admin" ? "text-white" : "text-zinc-400 hover:text-white"}
          >
            Overview
          </Link>
          <Link
            href="/admin/personas"
            className={
              pathname?.startsWith("/admin/personas")
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }
          >
            Personas
          </Link>
          <Link href="/account" className="text-zinc-400 hover:text-white">
            Exit
          </Link>
        </nav>
      </div>
      <div className="pt-8">{children}</div>
    </div>
  );
}
