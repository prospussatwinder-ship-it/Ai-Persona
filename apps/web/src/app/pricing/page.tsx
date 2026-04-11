import Link from "next/link";

const tiers = [
  {
    name: "Explorer",
    price: "$9",
    period: "/mo",
    blurb: "Try a few personas with fair-use messaging.",
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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-center text-3xl font-semibold text-white">Pricing</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-zinc-400">
        Placeholder tiers aligned with your monetization scope. Wire Stripe products and
        Checkout sessions to these plans when you are ready.
      </p>
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border p-6 ${
              t.highlight
                ? "border-violet-500/50 bg-violet-500/5 shadow-lg shadow-violet-900/20"
                : "border-zinc-800 bg-zinc-900/40"
            }`}
          >
            <h2 className="text-lg font-medium text-white">{t.name}</h2>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-white">{t.price}</span>
              <span className="text-sm text-zinc-500">{t.period}</span>
            </p>
            <p className="mt-2 text-sm text-zinc-400">{t.blurb}</p>
            <ul className="mt-6 space-y-2 text-sm text-zinc-300">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-violet-400">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={`mt-8 block rounded-xl py-2.5 text-center text-sm font-medium ${
                t.highlight
                  ? "bg-violet-600 text-white hover:bg-violet-500"
                  : "border border-zinc-600 text-white hover:border-zinc-400"
              }`}
            >
              Get started
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
