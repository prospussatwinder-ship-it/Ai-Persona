"use client";

import { FaqAccordion } from "./faq-accordion";

const ITEMS = [
  {
    q: "What does Persona Platform include?",
    a: "Auth, persona browse and chat, vector memory, subscription scaffolding, admin RBAC, audit logs, and AI usage views—structured as a real SaaS foundation.",
  },
  {
    q: "Can I connect Stripe?",
    a: "The data model and pricing pages are ready for Stripe Checkout and Customer Portal. Wire your products when you go live.",
  },
  {
    q: "How is memory scoped?",
    a: "Memory and conversations are modeled per user and persona so retrieval stays bounded and auditable.",
  },
  {
    q: "Who is the admin console for?",
    a: "Operators and admins manage users, roles, plans, personas, and review audit and usage data.",
  },
];

export function HomeFaq() {
  return <FaqAccordion items={ITEMS} />;
}
