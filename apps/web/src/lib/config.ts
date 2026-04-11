/** Base URL for Nest API (no `/v1` suffix). Trailing slashes stripped. */
export function getApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").trim();
  return raw.replace(/\/+$/, "");
}

export function getWsBase(): string {
  const u = getApiBase();
  if (u.startsWith("https://")) return `wss://${u.slice("https://".length)}`;
  if (u.startsWith("http://")) return `ws://${u.slice("http://".length)}`;
  return u;
}
