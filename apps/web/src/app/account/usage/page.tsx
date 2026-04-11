"use client";

import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function AccountUsagePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Usage</h1>
      <p className="mt-2 text-sm text-zinc-500">
        A dedicated usage API for end users can be added later. For now, explore personas and chat
        to exercise the platform.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/personas">
          <Card className="h-full transition hover:border-violet-500/30">
            <CardTitle>Browse personas</CardTitle>
            <CardDescription>Open the public directory and start a conversation.</CardDescription>
            <p className="mt-4 text-sm font-medium text-violet-400">Go →</p>
          </Card>
        </Link>
        <Link href="/help">
          <Card className="h-full transition hover:border-violet-500/30">
            <CardTitle>Help center</CardTitle>
            <CardDescription>FAQs and product context.</CardDescription>
            <p className="mt-4 text-sm font-medium text-violet-400">Go →</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
