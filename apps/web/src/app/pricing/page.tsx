import Link from "next/link";
import { PageHero, PageShell } from "@/components/ui/page-shell";

const tiers = [
  {
    name: "Explorer",
    price: "$9",
    period: "/mo",
    blurb: "Try personas with fair-use messaging and core memory.",
    features: ["Text chat", "Persona memory (vector)", "Email support"],
  },
  {
    name: "Creator",
    price: "$29",
    period: "/mo",
    blurb: "Higher limits and early access to voice previews.",
    features: ["Everything in Explorer", "Priority responses", "Voice add-on slot"],
    highlight: true,
  },
  {
    name: "Inner circle",
    price: "PPV",
    period: "",
    blurb: "À la carte unlocks and pay-per-view drops.",
    features: ["Per-drop checkout", "Receipts via Stripe", "Coming soon"],
  },
];

export default function PricingPage() {
  return (
    <main className="pp-mesh min-h-[60vh]">
      <PageShell size="xl">
        <PageHero
          eyebrow="Pricing"
          title="Plans that grow with your product"
          description="Illustrative tiers for positioning. Connect Stripe products, Checkout, and the Customer Portal when you go live—your database plans drive entitlements."
        />
        <div className="mt-4 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl border p-8 transition ${
                t.highlight
                  ? "border-violet-500/45 bg-gradient-to-b from-violet-500/[0.12] to-zinc-900/50 shadow-2xl shadow-violet-950/30 ring-1 ring-violet-500/20"
                  : "border-zinc-800/90 bg-zinc-900/40 backdrop-blur-sm hover:border-zinc-700/90"
              }`}
            >
              {t.highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg">
                  Popular
                </span>
              ) : null}
              <h2 className="text-lg font-semibold text-white">{t.name}</h2>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tabular-nums text-white">{t.price}</span>
                <span className="text-sm text-zinc-500">{t.period}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{t.blurb}</p>
              <ul className="mt-8 flex-1 space-y-3 text-sm text-zinc-300">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-violet-400" aria-hidden>
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-10 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                  t.highlight
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/25 hover:bg-violet-500"
                    : "border border-zinc-600 text-white hover:border-zinc-500"
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-14 text-center text-sm text-zinc-500">
          Questions?{" "}
          <Link href="/contact" className="font-medium text-violet-400 hover:underline">
            Contact sales
          </Link>{" "}
          or read the{" "}
          <Link href="/faq" className="font-medium text-violet-400 hover:underline">
            FAQ
          </Link>
          .
        </p>
      </PageShell>
    </main>
  );
}
