"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { apiFetch } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";

type Plan = {
  id: string;
  name: string;
  slug: string;
  price: string;
  billingCycle: string;
  aiRequestLimit: number;
  status: string;
};

export default function SubscriptionPlansPage() {
  const { user } = useAuth();
  const p = user?.permissions;
  const staff =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "OPERATOR";
  const canDel = staff || can(p, "subscriptions.delete");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function reload() {
    apiFetch<Plan[]>("/v1/admin/subscription-plans")
      .then(setPlans)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }

  useEffect(() => {
    reload();
  }, []);

  async function remove(id: string, name: string) {
    if (
      !window.confirm(
        `Delete plan “${name}”? Only allowed when no user subscriptions reference this plan.`
      )
    ) {
      return;
    }
    setBusy(id);
    try {
      await apiFetch(`/v1/admin/subscription-plans/${id}`, { method: "DELETE" });
      toast.success("Plan deleted");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div>
      <AdminPageHeader
        title="Subscription plans"
        description="Manage catalog plans. Plans in use cannot be hard-deleted."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Plans" }]}
      />

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-left text-sm text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Cycle</th>
              <th className="px-4 py-3">AI limit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/30">
                <td className="px-4 py-3 font-medium text-white">{plan.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{plan.slug}</td>
                <td className="px-4 py-3">{plan.price}</td>
                <td className="px-4 py-3">{plan.billingCycle}</td>
                <td className="px-4 py-3">{plan.aiRequestLimit}</td>
                <td className="px-4 py-3 font-mono text-xs">{plan.status}</td>
                <td className="px-4 py-3 text-right">
                  {canDel ? (
                    <button
                      type="button"
                      disabled={busy === plan.id}
                      onClick={() => void remove(plan.id, plan.name)}
                      className="text-xs text-red-400 hover:underline disabled:opacity-50"
                    >
                      {busy === plan.id ? "…" : "Delete"}
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Create and edit flows can be wired to the same API as your billing settings.{" "}
        <Link href="/admin/user-subscriptions" className="text-violet-400 hover:underline">
          User subscriptions
        </Link>
      </p>
    </div>
  );
}
