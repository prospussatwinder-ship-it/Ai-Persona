import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";

export default function TermsPage() {
  return (
    <main className="pp-mesh">
      <PageShell size="md">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Terms of service</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          This is placeholder legal copy for development. Replace with counsel-reviewed terms before
          production. The platform is provided as-is during evaluation; your deployment may add
          separate agreements with end users.
        </p>
        <ul className="mt-8 list-disc space-y-3 pl-5 text-sm text-zinc-400">
          <li>Acceptable use must comply with applicable laws and API provider policies.</li>
          <li>Service availability and SLAs are defined in your commercial agreement.</li>
          <li>Content and persona outputs remain your responsibility to moderate and disclose.</li>
        </ul>
        <p className="mt-10 text-sm text-zinc-500">
          <Link href="/legal/privacy" className="text-violet-400 hover:underline">
            Privacy policy
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
