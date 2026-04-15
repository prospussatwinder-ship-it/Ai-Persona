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

type ConversationRow = {
  id: string;
  title: string | null; // title of the conversation, can be null if no title is set
  updatedAt: string; // ISO 8601 format
  persona: { slug: string; name: string }; // slug and name of the persona  
};

export function ChatClient({ personaSlug, personaName }: { personaSlug: string; personaName: string }) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newChatBusy, setNewChatBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const createConversation = useCallback(async () => {
    const created = await apiFetch<{ id: string; title?: string | null }>(
      "/v1/conversations",
      {
        method: "POST",
        json: { personaSlug },
      }
    );
    const row: ConversationRow = {
      id: created.id,
      title: created.title ?? personaName,
      updatedAt: new Date().toISOString(),
      persona: { slug: personaSlug, name: personaName },
    };
    return row;
  }, [personaName, personaSlug]);

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
        const list = await apiFetch<{ conversations: ConversationRow[] }>("/v1/conversations");
        if (cancelled) return;
        const mine = list.conversations
          .filter((c) => c.persona.slug === personaSlug)
          .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
        setConversations(mine);
        if (mine.length > 0) {
          setActiveConversationId(mine[0].id);
        } else {
          const created = await createConversation();
          if (created && !cancelled) {
            setConversations([created]);
            setActiveConversationId(created.id);
          }
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
  }, [createConversation, personaSlug, router]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    setError(null);
    apiFetch<Msg[]>(`/v1/conversations/${activeConversationId}/messages`)
      .then((m) => {
        if (!cancelled) setMessages(Array.isArray(m) ? m : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load messages");
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  async function startNewChat() {
    setNewChatBusy(true);
    setError(null);
    try {
      const row = await createConversation();
      setConversations((prev) => [row, ...prev]);
      setActiveConversationId(row.id);
      setMessages([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create new chat");
    } finally {
      setNewChatBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || !activeConversationId) return;
    setInput("");
    setError(null);
    try {
      const res = await apiFetch<{
        userMessage: Msg;
        assistantMessage: Msg;
      }>(`/v1/conversations/${activeConversationId}/messages`, {
        method: "POST",
        json: { content: text },
      });
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
      setConversations((prev) =>
        [...prev]
          .map((c) =>
            c.id === activeConversationId ? { ...c, updatedAt: new Date().toISOString() } : c
          )
          .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
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

  if (error && !activeConversationId) {
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
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-7xl gap-4 px-4 py-6 sm:px-6">
      <aside className="hidden w-72 shrink-0 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3 md:flex">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-zinc-500">{personaName}</p>
            <h2 className="text-sm font-medium text-white">Chats</h2>
          </div>
          <button
            type="button"
            disabled={newChatBusy}
            onClick={() => void startNewChat()} 
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            + New
          </button>
        </div>
        <div className="space-y-1 overflow-y-auto">
          {conversations.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveConversationId(c.id)}
              className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                c.id === activeConversationId
                  ? "bg-violet-600/30 text-violet-100"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <p className="truncate font-medium">
                {c.title?.trim() || `${personaName} chat ${conversations.length - idx}`}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-500">
                {new Date(c.updatedAt).toLocaleString()}
              </p>
            </button>
          ))}
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-xs text-zinc-500">No chats yet.</p>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <Link
              href={`/personas/${personaSlug}`}
              className="text-xs text-violet-400 hover:underline"
            >
              ← {personaName}
            </Link>
            <h1 className="text-lg font-medium text-white">Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={newChatBusy}
              onClick={() => void startNewChat()}
              className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 md:hidden"
            >
              + New chat
            </button>
            {/* <button
              type="button"
              onClick={logout}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Log out
            </button> */}
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto py-4">
          {loadingMessages ? (
            <p className="text-center text-xs text-zinc-500">Loading chat history...</p>
          ) : null}
          {!loadingMessages && messages.length === 0 ? (
            <p className="text-center text-sm text-zinc-500">
              Start a message. This chat history is saved per persona and account.
            </p>
          ) : null}
          {!loadingMessages ? (
            <p className="text-center text-[11px] text-zinc-600">
              This persona adapts to your conversations over time.
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
        </div>
        <p className="mt-2 text-center text-[10px] text-zinc-600">
          API: {getApiBase()} · personalized memory is learned automatically
        </p>
      </div>
    </div>
  );
}
