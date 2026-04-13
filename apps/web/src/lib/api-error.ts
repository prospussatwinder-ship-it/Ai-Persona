/** Thrown by apiFetch when response is not ok. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function nestMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Request failed";
  const o = body as { message?: string | string[]; error?: string };
  if (Array.isArray(o.message)) return o.message.join(". ");
  if (typeof o.message === "string") return o.message;
  if (typeof o.error === "string") return o.error;
  return "Request failed";
}
