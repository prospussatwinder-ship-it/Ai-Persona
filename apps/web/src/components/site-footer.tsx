import Link from "next/link";

const product = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/personas", label: "Browse personas" },
  { href: "/faq", label: "FAQ" },
];

const company = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/help", label: "Help center" },
];

const legal = [
  { href: "/legal/age", label: "Age verification" },
  { href: "/legal/dmca", label: "DMCA" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
];

export function SiteFooter() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  return (
    <footer className="border-t border-zinc-800/90 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white shadow-lg shadow-violet-900/30">
                P
              </span>
              <span className="text-sm font-semibold text-white">
                Persona<span className="text-violet-400">Platform</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500">
              AI personas with scoped memory, realtime chat, and subscription-ready infrastructure—built
              for teams shipping serious products.
            </p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-3 lg:max-w-2xl lg:justify-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Product</p>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
                {product.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Company</p>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
                {company.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Legal & status</p>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
                {legal.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={`${apiBase}/v1/health`}
                    className="transition hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    API health
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-zinc-800/80 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} Persona Platform. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600">Built for production SaaS workflows.</p>
        </div>
      </div>
    </footer>
  );
}
