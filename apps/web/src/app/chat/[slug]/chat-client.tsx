"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/auth";
import { getApiBase } from "@/lib/config";

type Msg = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  metadata?: {
    replyToMessageId?: string;
    replyToRole?: string;
    replyToSnippet?: string;
    media?: Array<{
      kind?: "image" | "video";
      status?: string;
      url?: string;
      prompt?: string;
      message?: string;
    }>;
  };
};

type ConversationRow = {
  id: string;
  title: string | null; // title of the conversation, can be null if no title is set
  updatedAt: string; // ISO 8601 format
  persona: { slug: string; name: string }; // slug and name of the persona  
};

function formatAssistantText(content: string): string {
  let text = content.trim();
  if (!text) return text;

  // Normalize line breaks and force common section headings onto new lines.
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(
    /\b(ingredients|instructions|steps|tips|notes|summary)\s*:/gi,
    (m) => `\n${m[0].toUpperCase()}${m.slice(1)}`
  );

  // Put numbered steps and bullet points on separate lines.
  text = text.replace(/\s+(\d+\.)\s+/g, "\n$1 ");
  text = text.replace(/\s+([-*•])\s+/g, "\n$1 ");

  // Keep spacing clean.
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

function renderAssistantText(text: string) {
  const lines = formatAssistantText(text).split("\n");
  return (
    <div className="space-y-1">
      {lines.map((raw, idx) => {
        const line = raw.trim();
        if (!line) return <div key={idx} className="h-2" />;
        if (/^\d+\./.test(line)) {
          return (
            <p key={idx} className="font-medium text-zinc-100">
              {line}
            </p>
          );
        }
        if (/^[-*•]/.test(line)) {
          return (
            <p key={idx} className="pl-3 text-zinc-200">
              {line.replace(/^[-*•]\s*/, "• ")}
            </p>
          );
        }
        if (/^[A-Za-z][A-Za-z\s]{2,}:$/.test(line)) {
          return (
            <p key={idx} className="mt-2 font-semibold text-zinc-100">
              {line}
            </p>
          );
        }
        return (
          <p key={idx} className="text-zinc-200">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function splitForTyping(text: string) {
  // Keep spaces/newlines while typing so formatting appears naturally.
  return text.split(/(\s+)/).filter((part) => part.length > 0);
}

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
  const [sending, setSending] = useState(false);
  const [streamingAssistantId, setStreamingAssistantId] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{
    id: string;
    role: string;
    snippet: string;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const streamRunRef = useRef(0);

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

  async function deleteConversation(conversationId: string) {
    if (deletingConversationId) return;
    const ok = window.confirm("Delete this chat permanently?");
    if (!ok) return;
    setDeletingConversationId(conversationId);
    setError(null);
    try {
      await apiFetch<{ ok: boolean }>(`/v1/conversations/${conversationId}`, { method: "DELETE" });
      const next = conversations.filter((c) => c.id !== conversationId);
      setConversations(next);
      if (activeConversationId === conversationId) {
        if (next.length > 0) {
          setActiveConversationId(next[0].id);
        } else {
          const row = await createConversation();
          setConversations([row]);
          setActiveConversationId(row.id);
          setMessages([]);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete chat");
    } finally {
      setDeletingConversationId(null);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || !activeConversationId || sending) return;
    setInput("");
    setError(null);
    setSending(true);
    const tempId = `temp-user-${Date.now()}`;
    const optimisticUser: Msg = {
      id: tempId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    try {
      const res = await apiFetch<{
        userMessage: Msg;
        assistantMessage: Msg;
      }>(`/v1/conversations/${activeConversationId}/messages`, {
        method: "POST",
        json: { content: text, replyToMessageId: replyTarget?.id },
      });
      const runId = Date.now();
      streamRunRef.current = runId;
      const finalText = res.assistantMessage.content;
      const streamedAssistant: Msg = { ...res.assistantMessage, content: "" };
      setMessages((prev) => [
        ...prev.map((m) => (m.id === tempId ? res.userMessage : m)),
        streamedAssistant,
      ]);
      setStreamingAssistantId(streamedAssistant.id);

      const chunks = splitForTyping(finalText);
      let acc = "";
      for (let i = 0; i < chunks.length; i += 1) {
        if (streamRunRef.current !== runId) break;
        acc += chunks[i];
        const slice = acc;
        setMessages((prev) =>
          prev.map((m) => (m.id === streamedAssistant.id ? { ...m, content: slice } : m))
        );
        // Slower word-like typing for a more natural live effect.
        const delay = /\s/.test(chunks[i]) ? 10 : 35;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      if (streamRunRef.current === runId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamedAssistant.id ? { ...m, content: finalText } : m
          )
        );
      }
      setStreamingAssistantId(null);
      setReplyTarget(null);
      setConversations((prev) =>
        [...prev]
          .map((c) =>
            c.id === activeConversationId ? { ...c, updatedAt: new Date().toISOString() } : c
          )
          .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      );
    } catch (e) {
      streamRunRef.current = 0;
      setStreamingAssistantId(null);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
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
            <div
              key={c.id}
              className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                c.id === activeConversationId
                  ? "bg-violet-600/30 text-violet-100"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <button type="button" onClick={() => setActiveConversationId(c.id)} className="w-full text-left">
                <p className="truncate font-medium">
                  {c.title?.trim() || `${personaName} chat ${conversations.length - idx}`}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  {new Date(c.updatedAt).toLocaleString()}
                </p>
              </button>
              <button
                type="button"
                disabled={deletingConversationId === c.id}
                onClick={() => void deleteConversation(c.id)}
                className="mt-1 text-[10px] text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {deletingConversationId === c.id ? "Deleting..." : "Delete chat"}
              </button>
            </div>
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
              {/* This persona adapts to your conversations over time. */}
            </p>
          ) : null}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-1 text-sm ${
                  m.role === "user"
                    ? "bg-violet-600 text-white"
                    : "border border-zinc-700 bg-zinc-900 text-zinc-200"
                }`}
              >
                {m.metadata?.replyToSnippet ? (
                  <div className="mb-2 rounded-md border border-zinc-700/80 bg-zinc-950/40 px-2 py-1 text-xs text-zinc-400">
                    Reply to {m.metadata.replyToRole ?? "message"}: {m.metadata.replyToSnippet}
                  </div>
                ) : null}
                <div className={m.role === "assistant" ? "leading-7" : "whitespace-pre-wrap"}>
                  {m.role === "assistant" ? renderAssistantText(m.content) : m.content}
                  {m.role === "assistant" && streamingAssistantId === m.id ? (
                    <span className="ml-1 inline-block h-4 w-[2px] animate-pulse align-middle bg-violet-300" />
                  ) : null}
                </div>
                {m.role === "assistant" && Array.isArray(m.metadata?.media) && m.metadata!.media!.length > 0 ? (
                  <div className="mt-3 space-y-2 border-t border-zinc-700/70 pt-3">
                    {m.metadata!.media!.map((item, idx) => (
                      <div key={`${m.id}-media-${idx}`} className="rounded-lg border border-zinc-700/80 bg-zinc-950/60 p-2">
                        {item.kind === "image" && item.url ? (
                          <img
                            src={item.url}
                            alt={item.prompt || "Generated image"}
                            className="h-auto max-h-72 w-full rounded-md object-contain"
                          />
                        ) : null}
                        {item.kind === "video" && item.url ? (
                          <video src={item.url} controls className="h-auto max-h-72 w-full rounded-md" />
                        ) : null}
                        {item.message ? (
                          <p className="mt-1 text-xs text-zinc-400">
                            {item.kind?.toUpperCase() || "MEDIA"}: {item.message}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-0">
                  <button
                    type="button"
                    disabled={sending || streamingAssistantId === m.id}
                    onClick={() =>
                      setReplyTarget({
                        id: m.id,
                        role: m.role,
                        snippet: m.content.slice(0, 220),
                      })
                    }
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 disabled:opacity-80"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
          {sending ? (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
                <div className="mb-1 text-xs text-zinc-400">Thinking...</div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" />
                </div>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
        {error ? <p className="text-center text-xs text-red-400">{error}</p> : null}
        {replyTarget ? (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
            <span>
              Replying to {replyTarget.role}: {replyTarget.snippet}
            </span>x
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : null}
        <div className="flex gap-2 border-t border-zinc-800 pt-4">
          <input
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
            placeholder="Message…"
            value={input}
            disabled={sending}
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
            disabled={sending || !input.trim()}
            onClick={() => void send()}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Generating..." : "Send"}
          </button>
        </div>
        {/* <p className="mt-2 text-center text-[10px] text-zinc-600">
          API: {getApiBase()} · personalized memory is learned automatically
        </p> */}
      </div>
    </div>
  );
}
