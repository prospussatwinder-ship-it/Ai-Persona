"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, clearToken, getToken } from "@/lib/auth";

type Me = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  ageVerified: boolean;
  createdAt: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null | false>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    apiFetch<Me>("/v1/auth/me")
      .then((u) => {
        if (!cancelled) setMe(u);
      })
      .catch(() => {
        if (!cancelled) setMe(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (me === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm text-zinc-400">Loading…</div>
    );
  }

  if (me === false) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-red-400">Session invalid.</p>
        <button
          type="button"
          className="mt-4 text-violet-400 hover:underline"
          onClick={() => {
            clearToken();
            router.push("/login");
          }}
        >
          Log in again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-white">Account</h1>
      <dl className="mt-8 space-y-4 text-sm">
        <div>
          <dt className="text-zinc-500">Name</dt>
          <dd className="text-white">{me.displayName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Email</dt>
          <dd className="text-white">{me.email}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Role</dt>
          <dd className="text-white">{me.role}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Age verified</dt>
          <dd className="text-white">{me.ageVerified ? "Yes" : "Pending (wire provider)"}</dd>
        </div>
      </dl>
      <div className="mt-10 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-medium text-white">Billing</h2>
        <p className="text-sm text-zinc-400">
          Stripe subscriptions, PPV, and à la carte purchases will connect here (Checkout +
          Customer Portal).
        </p>
        <button
          type="button"
          disabled
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-500"
        >
          Manage subscription (soon)
        </button>
      </div>
      {me.role === "ADMIN" ? (
        <Link
          href="/admin"
          className="mt-8 inline-block rounded-xl border border-violet-500/40 px-4 py-2 text-sm text-violet-300 hover:bg-violet-500/10"
        >
          Admin dashboard →
        </Link>
      ) : null}
    </div>
  );
}
