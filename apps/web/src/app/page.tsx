import Link from "next/link";
import { getApiBase } from "@/lib/config";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { MarketingSection, SectionHeading } from "@/components/marketing/section-heading";
import { CtaBand, IconFeature } from "@/components/marketing/cta-band";
import { HomeFaq } from "@/components/marketing/home-faq";

const stats = [
  { value: "Realtime", label: "WebSocket-friendly chat" },
  { value: "pgvector", label: "Scoped AI memory" },
  { value: "RBAC", label: "Roles & permissions" },
  { value: "Stripe-ready", label: "Plans & metering hooks" },
];

const features = [
  {
    title: "Persona studio",
    body: "Create prompts, profiles, publish states, and visibility from one admin surface.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: "Vector memory",
    body: "Retrieve context safely per user and persona—built for RAG without crossing boundaries.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zm4 1h8M8 11h8M8 15h5" />
      </svg>
    ),
  },
  {
    title: "AI usage & limits",
    body: "Track requests, features, and status for support and fair-use policies.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Subscriptions",
    body: "Plans, trials, and user subscriptions modeled for Stripe and internal billing rules.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

const steps = [
  { n: "01", t: "Authenticate", d: "JWT sessions, roles, and permission-aware APIs." },
  { n: "02", t: "Pick a persona", d: "Browse published personas or route power users to admin tools." },
  { n: "03", t: "Chat with memory", d: "Messages and retrieval stay scoped to the conversation." },
  { n: "04", t: "Operate at scale", d: "Monitor usage, audit actions, and adjust plans from the console." },
];

const modules = [
  { title: "Admin console", desc: "Users, roles, plans, personas, AI usage, audit logs.", href: "/admin/dashboard" },
  { title: "Personas", desc: "Publish, visibility, prompts, and profile assets.", href: "/personas" },
  { title: "Account hub", desc: "Profile, security, subscription, and usage entry points.", href: "/account" },
  { title: "Reports", desc: "Operational KPIs from live platform data.", href: "/admin/reports" },
];

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
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative border-b border-zinc-800/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-30%,rgba(124,58,237,0.28),transparent_55%)]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-[min(100%,80rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
              AI personas platform
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Launch a premium AI persona experience—without rebuilding auth and ops from scratch.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
              Production-shaped foundations: secure accounts, scoped memory, realtime chat patterns,
              subscription entities, and an operator-grade admin suite.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/35 transition hover:bg-violet-500"
              >
                Start free
              </Link>
              <Link
                href="/personas"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900/40 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-zinc-500"
              >
                Browse personas
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center px-2 py-3.5 text-sm font-medium text-zinc-400 transition hover:text-white"
              >
                Features →
              </Link>
            </div>
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span>
                API:{" "}
                <span className={apiOk ? "font-mono text-emerald-400" : "font-mono text-amber-400"}>
                  {apiOk ? "healthy" : "check " + apiBase + "/health"}
                </span>
              </span>
              <span className="hidden sm:inline">·</span>
              <span>Designed for teams shipping real products</span>
            </p>
          </div>
          <div className="mt-14 lg:mt-0">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Trust stats */}
      <MarketingSection subtle>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 px-6 py-5 text-center"
            >
              <p className="text-lg font-semibold text-white">{s.value}</p>
              <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      {/* Features */}
      <MarketingSection>
        <SectionHeading
          eyebrow="Capabilities"
          title="Built for AI products, not toy demos"
          description="Everything wired together so you extend—not replace—your core flows."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <IconFeature key={f.title} icon={f.icon} title={f.title}>
              {f.body}
            </IconFeature>
          ))}
        </div>
      </MarketingSection>

      {/* How it works */}
      <MarketingSection subtle id="how-it-works">
        <SectionHeading
          eyebrow="Flow"
          title="How it works"
          description="From first login to operational control—four clear steps."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6">
              <span className="font-mono text-xs text-violet-400/80">{s.n}</span>
              <h3 className="mt-3 text-base font-semibold text-white">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.d}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      {/* Modules */}
      <MarketingSection>
        <SectionHeading
          eyebrow="Modules"
          title="One platform, many surfaces"
          description="Ship customer experiences and internal tools from the same codebase."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className="group rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/50 to-zinc-950/80 p-6 transition hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-950/20"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-violet-200">{m.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{m.desc}</p>
              <p className="mt-4 text-sm font-medium text-violet-400">Open →</p>
            </Link>
          ))}
        </div>
      </MarketingSection>

      {/* Social proof placeholder */}
      <MarketingSection subtle>
        <SectionHeading
          eyebrow="Teams"
          title="Trusted by product-led teams"
          description="Placeholder social proof—swap for logos or metrics when you have them."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {["Studio", "Labs", "Ventures", "Collective"].map((name) => (
            <div
              key={name}
              className="flex h-20 items-center justify-center rounded-xl border border-dashed border-zinc-700/80 bg-zinc-900/30 text-sm font-medium text-zinc-600"
            >
              {name}
            </div>
          ))}
        </div>
      </MarketingSection>

      {/* FAQ */}
      <MarketingSection id="faq">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="Short answers you can replace with final legal and product copy."
        />
        <div className="mx-auto max-w-3xl">
          <HomeFaq />
        </div>
      </MarketingSection>

      <CtaBand
        title="Ready to ship your persona product?"
        description="Create an account or explore the stack. Seed users unlock admin for local development."
        primary={{ href: "/register", label: "Create account" }}
        secondary={{ href: "/pricing", label: "View pricing" }}
      />
    </main>
  );
}
