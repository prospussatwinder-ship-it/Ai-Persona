import Link from "next/link";
import { PageHero, PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <main className="pp-mesh min-h-[60vh]">
      <PageShell>
        <PageHero
          eyebrow="Company"
          title="Built for teams who ship AI products"
          description="Persona Platform is a structured foundation: strong auth, clear data boundaries, and admin workflows that match how real SaaS teams operate."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-base font-semibold text-white">Principles</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              <li>
                <span className="text-violet-400">·</span> Safety by design with scoped memory and
                staff tooling.
              </li>
              <li>
                <span className="text-violet-400">·</span> Extensibility for billing, voice, and
                media.
              </li>
              <li>
                <span className="text-violet-400">·</span> Operational clarity with audit logs and
                usage views.
              </li>
            </ul>
          </Card>
          <Card>
            <h2 className="text-base font-semibold text-white">Who it is for</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Product teams building companion apps, coaching products, creative studios, and
              vertical AI assistants that need a serious account and admin layer.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block text-sm font-medium text-violet-400 hover:underline"
            >
              Talk to us
            </Link>
          </Card>
        </div>
      </PageShell>
    </main>
  );
}
