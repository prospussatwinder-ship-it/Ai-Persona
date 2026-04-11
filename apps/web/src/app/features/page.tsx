import Link from "next/link";
import { PageHero, PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/card";

const blocks = [
  {
    title: "Realtime conversations",
    body: "Low-latency chat with WebSocket-backed sessions and REST fallbacks for resilience.",
  },
  {
    title: "Scoped vector memory",
    body: "pgvector-backed retrieval scoped per user and persona—safe, auditable RAG patterns.",
  },
  {
    title: "Persona studio",
    body: "Publish personas with prompts, avatars, and visibility controls from the admin console.",
  },
  {
    title: "Subscriptions & limits",
    body: "Plan tiers, trials, and AI usage metering ready to connect to Stripe and your billing rules.",
  },
  {
    title: "Staff & RBAC",
    body: "Role-based permissions for operators, admins, and super-admins with audit trails.",
  },
  {
    title: "Compliance hooks",
    body: "Age verification flags, policy pages, and structured audit logs for operational review.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="pp-mesh min-h-[60vh]">
      <PageShell size="xl">
        <PageHero
          eyebrow="Platform"
          title="Everything you need to ship a persona product"
          description="A cohesive stack for AI personas—not a toy demo. Extend what exists: auth, memory, chat, billing scaffolding, and admin tools."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map((b) => (
            <Card key={b.title}>
              <h2 className="text-base font-semibold text-white">{b.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{b.body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-900/25 transition hover:bg-violet-500"
          >
            View pricing
          </Link>
          <Link
            href="/personas"
            className="rounded-xl border border-zinc-600 px-5 py-3 text-sm font-medium text-white transition hover:border-zinc-400"
          >
            Browse personas
          </Link>
        </div>
      </PageShell>
    </main>
  );
}
