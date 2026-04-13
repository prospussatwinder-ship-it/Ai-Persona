import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  const al = align === "center" ? "mx-auto text-center" : "text-left";
  return (
    <div className={`mb-12 max-w-3xl sm:mb-14 ${al}`}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400/90">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}

export function MarketingSection({
  id,
  children,
  className = "",
  subtle = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  subtle?: boolean;
}) {
  return (
    <section
      id={id}
      className={`py-20 sm:py-24 ${subtle ? "bg-zinc-900/20" : ""} ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">{children}</div>
    </section>
  );
}
