"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuth } from "@/lib/auth-context";
import { can } from "@/lib/permissions";
import { PersonaForm } from "../persona-form";

export default function NewPersonaPage() {
  const { user } = useAuth();
  const p = user?.permissions;
  const staff =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "OPERATOR";
  const allowed = staff || can(p, "personas.create");

  if (!allowed) {
    return (
      <p className="text-sm text-zinc-500">
        You do not have permission to create personas.{" "}
        <Link href="/admin/personas" className="text-violet-400 hover:underline">
          Back to list
        </Link>
      </p>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="New persona"
        description="Create a persona for the chat experience. Slug must be unique."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Personas", href: "/admin/personas" },
          { label: "New" },
        ]}
      />
      <PersonaForm mode="create" />
    </div>
  );
}
