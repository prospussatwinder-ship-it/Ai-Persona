import Link from "next/link";

const nav = [
  { href: "/personas", label: "Personas" },
  { href: "/pricing", label: "Pricing" },
  { href: "/account", label: "Account" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-white">
          Persona<span className="text-violet-400">Platform</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-zinc-400">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-white transition hover:border-zinc-400"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-white transition hover:bg-violet-500"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
