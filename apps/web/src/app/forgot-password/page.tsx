"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/auth";
import {
  AuthFieldLabel,
  AuthInput,
  AuthLayout,
  AuthPrimaryButton,
} from "@/components/ui/auth-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      await apiFetch("/v1/auth/forgot-password", {
        method: "POST",
        json: { email },
        authToken: null,
      });
      setMsg("If an account exists, reset instructions were sent. (Dev: check API logs for token.)");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Reset your password</h1>
      <p className="mt-2 text-sm text-zinc-400">
        <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300 hover:underline">
          Back to login
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <AuthFieldLabel>Email</AuthFieldLabel>
          <AuthInput
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {err ? <p className="text-sm text-red-400">{err}</p> : null}
        {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
        <AuthPrimaryButton type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </AuthPrimaryButton>
      </form>
    </AuthLayout>
  );
}
