import Link from "next/link";
import { PageHero, PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/card";

const links = [
  { href: "/faq", label: "Frequently asked questions", desc: "Billing, accounts, and personas." },
  { href: "/pricing", label: "Plans & pricing", desc: "Compare tiers and limits." },
  { href: "/features", label: "Platform features", desc: "What the stack includes out of the box." },
  { href: "/contact", label: "Contact support", desc: "Reach the team for pilots and partnerships." },
];

export default function HelpPage() {
  return (
    <main className="pp-mesh min-h-[60vh]">
      <PageShell>
        <PageHero
          eyebrow="Help center"
          title="Find answers and get unstuck"
          description="Start with FAQs and product docs. For account-specific issues, sign in and use your account area."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="h-full transition hover:border-violet-500/30 hover:bg-zinc-900/70">
                <h2 className="text-base font-semibold text-white">{l.label}</h2>
                <p className="mt-2 text-sm text-zinc-500">{l.desc}</p>
                <p className="mt-4 text-sm font-medium text-violet-400">Open →</p>
              </Card>
            </Link>
          ))}
        </div>
      </PageShell>
    </main>
  );
}
