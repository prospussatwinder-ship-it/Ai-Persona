import { notFound } from "next/navigation";
import { getApiBase } from "@/lib/config";
import { ChatClient } from "./chat-client";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = getApiBase();
  const res = await fetch(`${base}/v1/personas/${slug}`, { cache: "no-store" });
  if (res.status === 404) notFound();
  if (!res.ok) notFound();
  const persona = (await res.json()) as { name: string; slug: string };

  return <ChatClient personaSlug={persona.slug} personaName={persona.name} />;
}
