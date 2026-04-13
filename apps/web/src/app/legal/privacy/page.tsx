import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";

export default function PrivacyPage() {
  return (
    <main className="pp-mesh">
      <PageShell size="md">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Privacy policy</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Placeholder privacy notice for development. Replace with a policy that matches your data
          practices, subprocessors, retention, and regional requirements (GDPR, CCPA, etc.).
        </p>
        <ul className="mt-8 list-disc space-y-3 pl-5 text-sm text-zinc-400">
          <li>We collect account and usage data needed to operate the service.</li>
          <li>Vector memory and messages are stored per your deployment configuration.</li>
          <li>Analytics and error reporting should be disclosed when you enable them.</li>
        </ul>
        <p className="mt-10 text-sm text-zinc-500">
          <Link href="/legal/terms" className="text-violet-400 hover:underline">
            Terms of service
          </Link>
          {" · "}
          <Link href="/" className="text-violet-400 hover:underline">
            Home
          </Link>
        </p>
      </PageShell>
    </main>
  );
}
