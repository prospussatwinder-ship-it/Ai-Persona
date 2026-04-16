"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/auth";

type Overview = {
  active: {
    id: string;
    status: string;
    plan: {
      name: string;
      slug: string;
      price: number;
      currency: string;
      billingCycle: string;
    };
    endDate?: string | null;
  } | null;
  usage: {
    usedDaily: number;
    usedMonthly: number;
    remainingDaily: number | null;
    remainingMonthly: number | null;
    dailyLimit: number | null;
    monthlyLimit: number | null;
  };
};

export default function AccountSubscriptionPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch<Overview>("/v1/subscriptions")
      .then((res) => {
        if (!alive) return;
        setOverview(res);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load subscription");
      });
    return () => {
      alive = false;
    };
  }, []);

  const active = overview?.active ?? null;
  const usage = overview?.usage;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Subscription</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Live package data, limits, and entitlement status for your account.
      </p>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}

      <Card className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>
              {active
                ? `${active.plan.name} (${active.plan.slug}) • ${active.status}`
                : "No active package. Choose a package to unlock persona chat."}
            </CardDescription>
          </div>
          <Badge variant={active ? "success" : "warning"}>{active ? "Active" : "Inactive"}</Badge>
        </div>
        <div className="mt-8 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-sm text-zinc-500">
          {active ? (
            <div className="space-y-2 text-left">
              <p>
                Plan billing: {active.plan.currency.toUpperCase()} ${Number(active.plan.price).toFixed(2)} /{" "}
                {active.plan.billingCycle.toLowerCase()}
              </p>
              <p>Daily usage: {usage?.usedDaily ?? 0}{usage?.dailyLimit ? ` / ${usage.dailyLimit}` : ""}</p>
              <p>Monthly usage: {usage?.usedMonthly ?? 0}{usage?.monthlyLimit ? ` / ${usage.monthlyLimit}` : ""}</p>
              <p>
                Remaining daily: {usage?.remainingDaily ?? "unlimited"} · Remaining monthly:{" "}
                {usage?.remainingMonthly ?? "unlimited"}
              </p>
            </div>
          ) : (
            "No active package found for this account."
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="rounded-xl border border-zinc-600 px-4 py-2.5 text-sm text-white transition hover:border-zinc-400"
          >
            {active ? "Change package" : "View packages"}
          </Link>
        </div>
      </Card>
    </div>
  );
}
