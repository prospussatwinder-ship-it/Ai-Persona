"use client";

import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AccountSubscriptionPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Subscription</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Connect Stripe Checkout and Customer Portal to activate live billing.
      </p>

      <Card className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>Your entitlements will appear here after Stripe integration.</CardDescription>
          </div>
          <Badge variant="warning">Coming soon</Badge>
        </div>
        <div className="mt-8 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-sm text-zinc-500">
          No active subscription synced yet. Seed users may have plan rows in the database for
          development.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled
            className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-500"
          >
            Manage in portal (soon)
          </button>
          <Link
            href="/pricing"
            className="rounded-xl border border-zinc-600 px-4 py-2.5 text-sm text-white transition hover:border-zinc-400"
          >
            View pricing
          </Link>
        </div>
      </Card>
    </div>
  );
}
