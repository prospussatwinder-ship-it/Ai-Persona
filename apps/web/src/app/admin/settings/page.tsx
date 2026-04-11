"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminSettingsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Platform settings"
        description="Environment-facing configuration summary. Persisted product settings belong in the database when you add a settings service."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Settings" }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>API base URL</CardTitle>
              <CardDescription>Used by the web app for REST calls.</CardDescription>
            </div>
            <Badge variant="muted">Env</Badge>
          </div>
          <p className="mt-4 break-all font-mono text-xs text-violet-300">{apiUrl}</p>
          <p className="mt-3 text-xs text-zinc-500">
            Set <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_API_URL</code> in{" "}
            <code className="rounded bg-zinc-800 px-1">apps/web/.env.local</code>.
          </p>
        </Card>

        <Card>
          <CardTitle>Web origin</CardTitle>
          <CardDescription>Where this admin UI is served from (browser).</CardDescription>
          <p className="mt-4 font-mono text-xs text-zinc-300">{origin || "—"}</p>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Next steps</CardTitle>
          <CardDescription>Safe extensions for a production control plane.</CardDescription>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-400">
            <li>Add a persisted `PlatformSettings` table for branding, defaults, and feature flags.</li>
            <li>Gate destructive actions with approval workflows and stricter RBAC.</li>
            <li>Connect observability (metrics, traces) and surface SLOs here.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
