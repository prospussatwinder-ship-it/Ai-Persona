export function StatCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const trendCls =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-rose-400"
        : "text-zinc-500";
  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {hint ? <p className={`mt-1 text-xs ${trendCls}`}>{hint}</p> : null}
    </div>
  );
}
