"use client";

import { ApiError, nestMessage } from "./api-error";
import { AUTH_TOKEN_CHANGED_EVENT } from "./auth-events";

export const TOKEN_KEY = "persona_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function notifyTokenChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  notifyTokenChanged();
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  notifyTokenChanged();
}

export type ApiFetchInit = RequestInit & {
  json?: unknown;
  /**
   * Authorization header: `undefined` = use current `getToken()` at call time;
   * `string` = use exactly this JWT (avoids races when token changes mid-flight);
   * `null` = never send Authorization (e.g. login/register).
   */
  authToken?: string | null;
};

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { getApiBase } = await import("./config");
  const base = getApiBase();
  const { json, authToken, ...rest } = init;
  const headers = new Headers(rest.headers);
  const token = authToken !== undefined ? authToken : getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (json !== undefined) headers.set("Content-Type", "application/json");
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...rest,
      mode: "cors",
      credentials: "omit",
      headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Network error — is the API running on the URL in .env.local?";
    throw new ApiError(msg, 0, null);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text ? { message: text } : null;
  }
  if (!res.ok) {
    const msg = nestMessage(data);
    throw new ApiError(msg || res.statusText || "Request failed", res.status, data);
  }
  return data as T;
}
