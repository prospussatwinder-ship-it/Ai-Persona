import Link from "next/link";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { PageHero, PageShell } from "@/components/ui/page-shell";

const faqs = [
  {
    q: "What is Persona Platform?",
    a: "A full-stack foundation for AI persona products: auth, browse & chat, vector memory, subscriptions scaffolding, and a professional admin console.",
  },
  {
    q: "How does billing work?",
    a: "The codebase includes plan entities and Stripe-oriented hooks. Wire your Stripe products and Customer Portal when you go live—tiers on the pricing page are illustrative.",
  },
  {
    q: "Is my data isolated per user?",
    a: "Memory and conversations are modeled with user and persona scope. Follow your deployment checklist for production isolation and backups.",
  },
  {
    q: "Can I customize personas?",
    a: "Yes. Staff can create and publish personas, set visibility, and edit prompts and profiles from the admin area (with proper permissions).",
  },
  {
    q: "Where do I get support?",
    a: "Use the contact page for partnerships. For product issues, check help articles and your account area when logged in.",
  },
];

export default function FaqPage() {
  return (
    <main className="pp-mesh min-h-[60vh]">
      <PageShell>
        <PageHero
          eyebrow="FAQ"
          title="Common questions"
          description="Straight answers about the platform scope. Tune this copy for your go-to-market."
        />
        <div className="mx-auto max-w-3xl">
          <FaqAccordion items={faqs} />
        </div>
        <p className="mt-12 text-center text-sm text-zinc-500">
          Still stuck?{" "}
          <Link href="/contact" className="font-medium text-violet-400 hover:underline">
            Contact us
          </Link>{" "}
          or visit the{" "}
          <Link href="/help" className="font-medium text-violet-400 hover:underline">
            help center
          </Link>
          .
        </p>
      </PageShell>
    </main>
  );
}
