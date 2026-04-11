import Link from "next/link";
import { getApiBase } from "@/lib/config";

type PersonaCard = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  avatarUrl: string | null;
};

export default async function PersonasPage() {
  const base = getApiBase();
  let personas: PersonaCard[] = [];
  let fetchError: string | null = null;
  try {
    const res = await fetch(`${base}/v1/personas`, { cache: "no-store" });
    if (!res.ok) {
      fetchError = `API returned ${res.status}`;
    } else {
      const data = (await res.json()) as { personas?: PersonaCard[] };
      personas = data.personas ?? [];
    }
  } catch {
    fetchError = "Could not reach API — is it running on port 3001?";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Personas</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Choose a character to chat with. Memory is private per customer once you start a
        conversation.
      </p>
      {fetchError ? (
        <p className="mt-10 text-sm text-red-400">{fetchError}</p>
      ) : personas.length === 0 ? (
        <p className="mt-10 text-sm text-amber-400">
          No published personas — start Docker Postgres, then{" "}
          <code className="rounded bg-zinc-800 px-1">npm run db:migrate:deploy</code> and{" "}
          <code className="rounded bg-zinc-800 px-1">npm run db:seed</code> in{" "}
          <code className="rounded bg-zinc-800 px-1">packages/db</code>.
        </p>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => (
            <li key={p.id}>
              <Link
                href={`/personas/${p.slug}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-violet-500/40 hover:bg-zinc-900"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-lg font-semibold text-white">
                    {p.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-medium text-white">{p.name}</h2>
                    {p.tagline ? (
                      <p className="mt-1 text-sm text-zinc-400">{p.tagline}</p>
                    ) : null}
                  </div>
                </div>
                {p.description ? (
                  <p className="mt-3 line-clamp-3 text-sm text-zinc-500">{p.description}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
