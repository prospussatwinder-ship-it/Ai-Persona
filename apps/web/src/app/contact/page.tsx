"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHero, PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/card";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Persona Platform — ${name || "Contact"}`);
    const body = encodeURIComponent(`${message}\n\n—\nName: ${name}\nEmail: ${email}`);
    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
    toast.success("Opening your email client…", {
      description: "Replace support@example.com in contact/page.tsx with your inbox.",
    });
  }

  return (
    <main className="pp-mesh min-h-[60vh]">
      <PageShell size="md">
        <PageHero
          eyebrow="Contact"
          title="Let's build your next persona product"
          description="Starter contact flow using mailto. Wire to CRM or helpdesk when ready."
        />
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400">Name</label>
              <input
                required
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400">Work email</label>
              <input
                required
                type="email"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400">How can we help?</label>
              <textarea
                required
                rows={5}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-medium text-white transition hover:bg-violet-500 sm:w-auto sm:px-8"
            >
              Send via email
            </button>
            <p className="text-xs text-zinc-500">
              Uses a mailto link for zero backend setup. Replace the address in the source file.
            </p>
          </form>
        </Card>
      </PageShell>
    </main>
  );
}
