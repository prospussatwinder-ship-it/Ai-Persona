import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiBase } from "@/lib/config";
import { PersonaActions } from "./persona-actions";

type Persona = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  avatarUrl: string | null;
};

export default async function PersonaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = getApiBase();
  const res = await fetch(`${base}/v1/personas/${slug}`, { cache: "no-store" });
  if (res.status === 404) notFound();
  if (!res.ok) notFound();
  const persona = (await res.json()) as Persona;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link href="/personas" className="text-sm text-violet-400 hover:underline">
        ← All personas
      </Link>
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-fuchsia-500/30 text-3xl font-semibold">
          {persona.name.slice(0, 1)}
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-white">{persona.name}</h1>
          {persona.tagline ? (
            <p className="mt-2 text-lg text-zinc-400">{persona.tagline}</p>
          ) : null}
          {persona.description ? (
            <p className="mt-4 text-zinc-400">{persona.description}</p>
          ) : null}
          <PersonaActions slug={persona.slug} />
        </div>
      </div>
    </div>
  );
}
