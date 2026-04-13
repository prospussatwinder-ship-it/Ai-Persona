export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "muted";
}) {
  const cls =
    variant === "success"
      ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/25"
      : variant === "warning"
        ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25"
        : variant === "muted"
          ? "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700"
          : "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/25";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}
