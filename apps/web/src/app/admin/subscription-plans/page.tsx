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
  description?: string | null;
  price: string;
  billingCycle: string;
  trialDays?: number;
  aiRequestLimit: number;
  featureConfig?: Record<string, unknown> | null;
  status: string;
};

type PlanForm = {
  name: string;
  slug: string;
  description: string;
  price: string;
  billingCycle: "MONTHLY" | "YEARLY" | "LIFETIME" | "ONCE";
  trialDays: string;
  aiRequestLimit: string;
  status: "ACTIVE" | "INACTIVE";
  featureConfig: string;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [form, setForm] = useState<PlanForm>({
    name: "",
    slug: "",
    description: "",
    price: "9.99",
    billingCycle: "MONTHLY",
    trialDays: "0",
    aiRequestLimit: "200",
    status: "ACTIVE",
    featureConfig: JSON.stringify(
      {
        allowedPersonaSlugs: [],
        dailyLimit: 20,
        monthlyLimit: 200,
        memoryDepth: "standard",
        voiceAccess: false,
      },
      null,
      2
    ),
  });

  function reload() {
    apiFetch<Plan[]>("/v1/admin/subscription-plans")
      .then(setPlans)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }

  useEffect(() => {
    reload();
  }, []);

  function onEdit(plan: Plan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? "",
      price: String(plan.price ?? "0"),
      billingCycle: (plan.billingCycle as PlanForm["billingCycle"]) ?? "MONTHLY",
      trialDays: String(plan.trialDays ?? 0),
      aiRequestLimit: String(plan.aiRequestLimit ?? 0),
      status: (plan.status as PlanForm["status"]) ?? "ACTIVE",
      featureConfig: JSON.stringify(plan.featureConfig ?? {}, null, 2),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm((prev) => ({ ...prev, name: "", slug: "", description: "" }));
  }

  async function submitForm() {
    setFormBusy(true);
    try {
      const parsed = form.featureConfig.trim() ? JSON.parse(form.featureConfig) : {};
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        currency: "usd",
        billingCycle: form.billingCycle,
        trialDays: Number(form.trialDays),
        aiRequestLimit: Number(form.aiRequestLimit),
        status: form.status,
        featureConfig: parsed,
      };
      if (editingId) {
        await apiFetch(`/v1/admin/subscription-plans/${editingId}`, {
          method: "PUT",
          json: payload,
        });
        toast.success("Plan updated");
      } else {
        await apiFetch("/v1/admin/subscription-plans", {
          method: "POST",
          json: payload,
        });
        toast.success("Plan created");
      }
      resetForm();
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setFormBusy(false);
    }
  }

  async function deactivate(plan: Plan) {
    setBusy(plan.id);
    try {
      await apiFetch(`/v1/admin/subscription-plans/${plan.id}`, {
        method: "PUT",
        json: { status: "INACTIVE" },
      });
      toast.success("Plan deactivated");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deactivate failed");
    } finally {
      setBusy(null);
    }
  }

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
        <div className="border-b border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="text-sm font-medium text-white">{editingId ? "Edit plan" : "Create plan"}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Plan name"
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
            <input
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="Slug (basic/pro/premium)"
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
            <input
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              placeholder="Price"
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
            <input
              value={form.trialDays}
              onChange={(e) => setForm((p) => ({ ...p, trialDays: e.target.value }))}
              placeholder="Trial days"
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
            <input
              value={form.aiRequestLimit}
              onChange={(e) => setForm((p) => ({ ...p, aiRequestLimit: e.target.value }))}
              placeholder="AI request limit"
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
            <select
              value={form.billingCycle}
              onChange={(e) =>
                setForm((p) => ({ ...p, billingCycle: e.target.value as PlanForm["billingCycle"] }))
              }
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="MONTHLY">MONTHLY</option>
              <option value="YEARLY">YEARLY</option>
              <option value="LIFETIME">LIFETIME</option>
              <option value="ONCE">ONCE</option>
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as PlanForm["status"] }))}
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description"
              className="md:col-span-2 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
            <textarea
              value={form.featureConfig}
              onChange={(e) => setForm((p) => ({ ...p, featureConfig: e.target.value }))}
              placeholder="Feature config JSON"
              className="md:col-span-3 min-h-28 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono"
            />
            <div className="md:col-span-3 flex gap-2">
              <button
                type="button"
                disabled={formBusy}
                onClick={() => void submitForm()}
                className="rounded bg-violet-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                {formBusy ? "Saving..." : editingId ? "Update plan" : "Create plan"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded border border-zinc-700 px-3 py-2 text-xs text-zinc-300"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
        </div>
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
                  <div className="inline-flex gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(plan)}
                      className="text-xs text-violet-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy === plan.id}
                      onClick={() => void deactivate(plan)}
                      className="text-xs text-amber-400 hover:underline disabled:opacity-50"
                    >
                      {busy === plan.id ? "…" : "Deactivate"}
                    </button>
                    {canDel ? (
                      <button
                        type="button"
                        disabled={busy === plan.id}
                        onClick={() => void remove(plan.id, plan.name)}
                        className="text-xs text-red-400 hover:underline disabled:opacity-50"
                      >
                        {busy === plan.id ? "…" : "Delete"}
                      </button>
                    ) : null}
                  </div>
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
