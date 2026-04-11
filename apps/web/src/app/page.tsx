import Link from "next/link";
import { getApiBase } from "@/lib/config";

export default async function Home() {
  const apiBase = getApiBase();
  let apiOk = false;
  try {
    const res = await fetch(`${apiBase}/health`, { cache: "no-store" });
    const j = (await res.json()) as { ok?: boolean };
    apiOk = res.ok && j.ok === true;
  } catch {
    apiOk = false;
  }

  return (
    <main>
      <section className="relative overflow-hidden border-b border-zinc-800/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(124,58,237,0.22),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-violet-300/90">
            Personas · memory · realtime
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Your AI personas, with a private memory for every customer.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-zinc-400">
            Core platform scaffold: auth, browse personas, WebSocket-friendly chat, pgvector
            memory, admin tools, and room to plug in Stripe, voice, and avatars.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/personas"
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500"
            >
              Meet the personas
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-zinc-600 px-5 py-3 text-sm font-medium text-white transition hover:border-zinc-400"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-8 text-xs text-zinc-500">
            API status:{" "}
            <span className={apiOk ? "text-emerald-400" : "text-amber-400"}>
              {apiOk ? "connected" : `check ${apiBase}/health and Docker`}
            </span>
            {" · "}
            Web dev: <span className="font-mono text-zinc-400">localhost:3002</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          Platform pillars
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "Realtime chat",
              d: "WebSocket channel per conversation; REST fallback for messages.",
            },
            {
              t: "Vector memory",
              d: "pgvector rows scoped per user + persona for safe RAG retrieval.",
            },
            {
              t: "Monetization-ready",
              d: "Pricing page stub — wire Stripe subscriptions, PPV, and à la carte.",
            },
            {
              t: "Admin & compliance",
              d: "Admin dashboard shell, age gate flag on users, DMCA policy page.",
            },
          ].map((x) => (
            <div
              key={x.t}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm"
            >
              <h3 className="font-medium text-white">{x.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-white">Seed accounts</h2>
              <p className="mt-2 text-sm text-zinc-400">
                After <code className="rounded bg-zinc-800 px-1.5 py-0.5">npm run db:seed</code>:
                customer <code className="font-mono text-zinc-300">customer@phase1.local</code> /
                <code className="font-mono text-zinc-300"> Customer123!Phase1</code>
                · admin <code className="font-mono text-zinc-300">admin@phase1.local</code> /
                <code className="font-mono text-zinc-300"> Admin123!Phase1</code>
              </p>
            </div>
            <Link
              href="/register"
              className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Create your account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
