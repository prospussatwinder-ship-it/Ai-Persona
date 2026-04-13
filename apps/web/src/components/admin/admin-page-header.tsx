import Link from "next/link";

type Crumb = { label: string; href?: string };

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-zinc-800/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumbs?.length ? (
          <nav className="mb-3 text-xs font-medium text-zinc-500" aria-label="Breadcrumb">
            {breadcrumbs.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 ? <span className="mx-2 text-zinc-600">/</span> : null}
                {c.href ? (
                  <Link href={c.href} className="transition hover:text-zinc-300">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-zinc-400">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
