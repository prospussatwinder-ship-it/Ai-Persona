"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, clearToken, getToken } from "@/lib/auth";
import { getApiBase } from "@/lib/config";

type Msg = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type PersonaTraining = {
  title: string | null;
  trainingNotes: string | null;
  structuredProfile: Record<string, unknown> | null;
};

export function ChatClient({ personaSlug, personaName }: { personaSlug: string; personaName: string }) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTraining, setShowTraining] = useState(false);
  const [trainingBusy, setTrainingBusy] = useState(false);
  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingNotes, setTrainingNotes] = useState("");
  const [trainingJson, setTrainingJson] = useState("{}");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?next=/chat/${personaSlug}`);
      return;
    }

    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const list = await apiFetch<{
          conversations: {
            id: string;
            persona: { slug: string };
          }[];
        }>("/v1/conversations");
        if (cancelled) return;
        const existing = list.conversations.find((c) => c.persona.slug === personaSlug);
        if (existing) {
          setConversationId(existing.id);
          const m = await apiFetch<Msg[]>(`/v1/conversations/${existing.id}/messages`);
          if (!cancelled) setMessages(Array.isArray(m) ? m : []);
        } else {
          const created = await apiFetch<{ id: string }>("/v1/conversations", {
            method: "POST",
            json: { personaSlug },
          });
          if (cancelled) return;
          setConversationId(created.id);
          setMessages([]);
        }
        try {
          const trainingRes = await apiFetch<{
            training: PersonaTraining | null;
          }>(`/v1/personas/${personaSlug}/training`);
          if (!cancelled) {
            setTrainingTitle(trainingRes.training?.title ?? "");
            setTrainingNotes(trainingRes.training?.trainingNotes ?? "");
            setTrainingJson(
              JSON.stringify(trainingRes.training?.structuredProfile ?? {}, null, 2)
            );
          }
        } catch {
          // Do not block chat boot if training endpoint has transient errors.
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not open chat");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [personaSlug, router]);

  async function send() {
    const text = input.trim();
    if (!text || !conversationId) return;
    setInput("");
    setError(null);
    try {
      const res = await apiFetch<{
        userMessage: Msg;
        assistantMessage: Msg;
      }>(`/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        json: { content: text },
      });
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    }
  }

  async function saveTraining() {
    setTrainingBusy(true);
    setError(null);
    try {
      const structured = trainingJson.trim()
        ? (JSON.parse(trainingJson) as Record<string, unknown>)
        : {};
      await apiFetch(`/v1/personas/${personaSlug}/training`, {
        method: "PUT",
        json: {
          title: trainingTitle.trim() || undefined,
          trainingNotes: trainingNotes.trim() || undefined,
          structuredProfile: structured,
        },
      });
      setShowTraining(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Training update failed");
    } finally {
      setTrainingBusy(false);
    }
  }

  function logout() {
    clearToken();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-400">
        Opening chat…
      </div>
    );
  }

  if (error && !conversationId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-red-400">{error}</p>
        <Link href="/personas" className="mt-4 inline-block text-violet-400 hover:underline">
          Back to personas
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <Link href={`/personas/${personaSlug}`} className="text-xs text-violet-400 hover:underline">
            ← {personaName}
          </Link>
          <h1 className="text-lg font-medium text-white">Chat</h1>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Log out
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Say hi — Phase 1 routes chat through Nest → FastAPI. Set{" "}
            <code className="text-zinc-400">OPENAI_API_KEY</code> on the AI worker for quality
            replies; pgvector-backed memory wiring is next increment.
          </p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-violet-600 text-white"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-200"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {error ? <p className="text-center text-xs text-red-400">{error}</p> : null}
      <div className="flex gap-2 border-t border-zinc-800 pt-4">
        <input
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
          placeholder="Message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void send()}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Send
        </button>
        <button
          type="button"
          onClick={() => setShowTraining((v) => !v)}
          className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          {showTraining ? "Hide training" : "Persona training"}
        </button>
      </div>
      {showTraining ? (
        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <p className="text-xs text-zinc-500">
            Personalize this persona for your account only. Stored per user + persona.
          </p>
          <label className="mt-2 block text-xs text-zinc-400">
            Profile title
            <input
              value={trainingTitle}
              onChange={(e) => setTrainingTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
            />
          </label>
          <label className="mt-2 block text-xs text-zinc-400">
            Notes
            <textarea
              value={trainingNotes}
              onChange={(e) => setTrainingNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
            />
          </label>
          <label className="mt-2 block text-xs text-zinc-400">
            Structured JSON
            <textarea
              value={trainingJson}
              onChange={(e) => setTrainingJson(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-white"
            />
          </label>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={trainingBusy}
              onClick={() => void saveTraining()}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {trainingBusy ? "Saving..." : "Save training"}
            </button>
          </div>
        </div>
      ) : null}
      <p className="mt-2 text-center text-[10px] text-zinc-600">
        API: {getApiBase()} · Phase 1 uses request/response; WebSocket streaming comes later
      </p>
    </div>
  );
}
