/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero, PageShell } from "@/components/ui/page-shell";
import { apiFetch, getToken } from "@/lib/auth";

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  billingCycle: string;
  trialDays: number;
  aiRequestLimit: number;
  featureConfig: Record<string, unknown> | null;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch<{ plans: Plan[] }>("/v1/subscriptions/plans", { authToken: null })
      .then((res) => {
        if (!alive) return;
        setPlans(res.plans ?? []);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load plans");
      });
    return () => {
      alive = false;
    };
  }, []);

  async function subscribe(plan: Plan) {
    const token = getToken();
    if (!token) {
      window.location.href = `/login?next=/pricing`;
      return;
    }
    setBusySlug(plan.slug);
    setError(null);
    try {
      const res = await apiFetch<{
        url?: string | null;
        mock?: boolean;
        message?: string;
      }>("/v1/billing/checkout/subscription", {
        method: "POST",
        json: {
          provider: "crypto",
          planSlug: plan.slug,
        },
      });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      if (res.mock) {
        alert(res.message ?? "Checkout initialized in mock mode.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <main className="pp-mesh min-h-[60vh]">
      <PageShell size="xl">
        <PageHero
          eyebrow="Pricing"
          title="Plans and package access"
          description="Packages are loaded from backend plan configuration and tied to real entitlement checks."
        />
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        <div className="mt-4 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {plans.map((t) => {
            const cfg = (t.featureConfig ?? {}) as any;
            const allowedAgents: string[] = Array.isArray(cfg.allowedPersonaSlugs)
              ? cfg.allowedPersonaSlugs.map((x: unknown) => String(x))
              : [];
            const dailyLimit = Number(cfg.dailyLimit ?? 0) || null;
            const monthlyLimit = Number(cfg.monthlyLimit ?? t.aiRequestLimit);
            const highlight = t.slug.toLowerCase() === "pro";

            return (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl border p-8 transition ${
                highlight
                  ? "border-violet-500/45 bg-gradient-to-b from-violet-500/[0.12] to-zinc-900/50 shadow-2xl shadow-violet-950/30 ring-1 ring-violet-500/20"
                  : "border-zinc-800/90 bg-zinc-900/40 backdrop-blur-sm hover:border-zinc-700/90"
              }`}
            >
              {highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg">
                  Popular
                </span>
              ) : null}
              <h2 className="text-lg font-semibold text-white">{t.name}</h2>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tabular-nums text-white">
                  ${Number(t.price).toFixed(2)}
                </span>
                <span className="text-sm text-zinc-500">/{t.billingCycle.toLowerCase()}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {t.description ?? "Persona package with usage and access controls."}
              </p>
              <ul className="mt-8 flex-1 space-y-3 text-sm text-zinc-300">
                <li className="flex gap-2">
                  <span className="text-violet-400">✓</span>
                  Monthly chat limit: {monthlyLimit}
                </li>
                {dailyLimit ? (
                  <li className="flex gap-2">
                    <span className="text-violet-400">✓</span>
                    Daily chat limit: {dailyLimit}
                  </li>
                ) : null}
                <li className="flex gap-2">
                  <span className="text-violet-400">✓</span>
                  Trial days: {t.trialDays}
                </li>
                {allowedAgents.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-violet-400" aria-hidden>
                      ✓
                    </span>
                    Agent access: {f}
                  </li>
                ))}
                {allowedAgents.length === 0 ? (
                  <li className="flex gap-2">
                    <span className="text-violet-400" aria-hidden>
                      ✓
                    </span>
                    All published agents (subject to account status)
                  </li>
                ) : null}
              </ul>
              <button
                type="button"
                disabled={busySlug === t.slug}
                onClick={() => void subscribe(t)}
                className={`mt-10 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                  highlight
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/25 hover:bg-violet-500"
                    : "border border-zinc-600 text-white hover:border-zinc-500"
                } disabled:opacity-60`}
              >
                {busySlug === t.slug ? "Processing..." : "Buy / Subscribe"}
              </button>
            </div>
          );
        })}
        </div>
        <p className="mt-14 text-center text-sm text-zinc-500">
          Questions?{" "}
          <Link href="/contact" className="font-medium text-violet-400 hover:underline">
            Contact sales
          </Link>{" "}
          or read the{" "}
          <Link href="/faq" className="font-medium text-violet-400 hover:underline">
            FAQ
          </Link>
          .
        </p>
      </PageShell>
    </main>
  );
}
