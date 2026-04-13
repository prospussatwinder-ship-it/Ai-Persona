/**
 * Abstract product preview — no external assets, pure CSS.
 */
export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-violet-600/20 via-transparent to-fuchsia-600/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950/90 shadow-2xl shadow-black/50 ring-1 ring-white/5">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
          </div>
          <span className="ml-2 font-mono text-[10px] text-zinc-500">app.persona.io / chat</span>
        </div>
        <div className="grid gap-0 sm:grid-cols-5">
          <div className="border-b border-zinc-800/80 p-4 sm:border-b-0 sm:border-r sm:border-zinc-800/80">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Personas</p>
            <ul className="mt-3 space-y-2">
              {["Nova", "River", "Ember"].map((name, i) => (
                <li
                  key={name}
                  className={`rounded-lg px-2 py-1.5 text-xs ${i === 0 ? "bg-violet-500/15 text-violet-200" : "text-zinc-500"}`}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">Conversation</p>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                Live
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-zinc-800 px-3 py-2 text-xs leading-relaxed text-zinc-300">
                Summarize yesterday’s notes with persona tone.
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-tl-md border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs leading-relaxed text-violet-100">
                Here is a concise recap aligned with your persona voice…
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2">
              <div className="h-8 flex-1 rounded-lg bg-zinc-800/80" />
              <div className="h-8 w-14 rounded-lg bg-violet-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
