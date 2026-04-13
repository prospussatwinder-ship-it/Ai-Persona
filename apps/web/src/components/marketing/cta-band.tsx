import Link from "next/link";
import type { ReactNode } from "react";

export function CtaBand({
  title,
  description,
  primary,
  secondary,
}: {
  title: string;
  description: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="border-y border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-zinc-900/80 to-fuchsia-950/40 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primary.href}
            className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg transition hover:bg-zinc-100"
          >
            {primary.label}
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-zinc-500/50 bg-zinc-900/50 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-zinc-400"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function IconFeature({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-6 transition hover:border-violet-500/25 hover:bg-zinc-900/60">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20 transition group-hover:bg-violet-500/15">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{children}</p>
    </div>
  );
}
