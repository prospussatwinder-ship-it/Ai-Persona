"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: string };

export function FaqAccordion({
  items,
  className = "",
}: {
  items: FaqItem[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/40 transition hover:border-zinc-700/90"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-white sm:text-base">{item.q}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition ${
                  isOpen ? "rotate-180 border-violet-500/40 text-violet-300" : ""
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                  <path d="M6 8L1 3h10L6 8z" />
                </svg>
              </span>
            </button>
            {isOpen ? (
              <div className="border-t border-zinc-800/80 px-5 pb-4 pt-0">
                <p className="text-sm leading-relaxed text-zinc-400">{item.a}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
