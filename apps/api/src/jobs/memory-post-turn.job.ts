/**
 * Deferred post-turn memory work (semantic vector + model-based fact extraction).
 * Runs in-process via setImmediate; same interface can later enqueue to Redis/BullMQ.
 */
export type MemoryPostTurnPayload = {
  userId: string;
  personaId: string;
  conversationId: string;
  userText: string;
  assistantText: string;
  recentExchange: string;
};

export function scheduleMemoryPostTurnJob(run: (payload: MemoryPostTurnPayload) => Promise<void>) {
  return (payload: MemoryPostTurnPayload) => {
    setImmediate(() => {
      void run(payload).catch(() => undefined);
    });
  };
}
