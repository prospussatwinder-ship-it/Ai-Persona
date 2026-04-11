import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Centered auth layout: mesh background + elevated card for login/register/forgot flows.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pp-mesh min-h-[calc(100vh-3.5rem)] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-[420px]">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-white transition hover:text-violet-300"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white shadow-lg shadow-violet-900/40">
            P
          </span>
          Persona<span className="text-violet-400">Platform</span>
        </Link>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-zinc-600">
          Secure sign-in · Same stack as production deployments
        </p>
      </div>
    </div>
  );
}

export function AuthFieldLabel({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-medium text-zinc-400">{children}</label>;
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`mt-1.5 w-full rounded-xl border border-zinc-700/90 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 ${props.className ?? ""}`}
    />
  );
}

export function AuthTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`mt-1.5 w-full rounded-xl border border-zinc-700/90 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 ${props.className ?? ""}`}
    />
  );
}

export function AuthPrimaryButton({
  className = "",
  type = "submit",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      {...props}
      className={`w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/25 transition hover:bg-violet-500 disabled:opacity-60 ${className}`}
    />
  );
}
