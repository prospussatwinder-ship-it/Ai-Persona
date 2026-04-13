"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { apiFetch } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { PersonaForm, type PersonaFormValues } from "../../persona-form";

type PersonaApi = {
  id: string;
  slug: string;
  name: string;
  isPublished: boolean;
  isActive: boolean;
  visibility: "PUBLIC" | "PRIVATE";
  profile: {
    tagline: string | null;
    description: string | null;
    systemPrompt: string | null;
    avatarUrl: string | null;
  } | null;
};

export default function EditPersonaPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const p = user?.permissions;
  const staff =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "OPERATOR";
  const allowed = staff || can(p, "personas.edit");

  const [data, setData] = useState<PersonaApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let c = false;
    apiFetch<PersonaApi>(`/v1/admin/personas/${id}`)
      .then((r) => {
        if (!c) setData(r);
      })
      .catch((e) => {
        if (!c) setError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      c = true;
    };
  }, [id]);

  if (!allowed) {
    return (
      <p className="text-sm text-zinc-500">
        You do not have permission to edit personas.{" "}
        <Link href="/admin/personas" className="text-violet-400 hover:underline">
          Back
        </Link>
      </p>
    );
  }

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) {
    return (
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-xl bg-zinc-900" />
      </div>
    );
  }

  const initial: Partial<PersonaFormValues> = {
    slug: data.slug,
    name: data.name,
    isPublished: data.isPublished,
    isActive: data.isActive,
    visibility: data.visibility,
    tagline: data.profile?.tagline ?? "",
    description: data.profile?.description ?? "",
    systemPrompt: data.profile?.systemPrompt ?? "",
    avatarUrl: data.profile?.avatarUrl ?? "",
  };

  return (
    <div>
      <AdminPageHeader
        title={`Edit · ${data.name}`}
        description="Update persona metadata and prompts."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Personas", href: "/admin/personas" },
          { label: data.name, href: `/admin/personas/${id}` },
          { label: "Edit" },
        ]}
      />
      <PersonaForm key={data.id} mode="edit" personaId={id} initial={initial} />
    </div>
  );
}
