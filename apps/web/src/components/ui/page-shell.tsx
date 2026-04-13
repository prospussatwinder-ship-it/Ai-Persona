import type { ReactNode } from "react";

/**
 * Consistent max-width + horizontal padding for marketing and app pages.
 */
export function PageShell({
  children,
  className = "",
  size = "lg",
}: {
  children: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  const max =
    size === "md" ? "max-w-3xl" : size === "xl" ? "max-w-7xl" : "max-w-6xl";
  return (
    <div className={`mx-auto w-full px-4 py-12 sm:px-6 sm:py-16 ${max} ${className}`}>
      {children}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-10 sm:mb-14">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">{description}</p>
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}
