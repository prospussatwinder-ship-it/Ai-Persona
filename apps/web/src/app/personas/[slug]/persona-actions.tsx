"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

export function PersonaActions({ slug }: { slug: string }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, []);

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href={`/chat/${slug}`}
        className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500"
      >
        {loggedIn ? "Continue chat" : "Start chat"}
      </Link>
      {loggedIn ? null : (
        <Link
          href={`/login?next=/chat/${slug}`}
          className="rounded-xl border border-zinc-600 px-5 py-3 text-sm font-medium text-white hover:border-zinc-400"
        >
          Log in first
        </Link>
      )}
    </div>
  );
}
