"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, clearToken, setToken } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import {
  AuthFieldLabel,
  AuthInput,
  AuthLayout,
  AuthPrimaryButton,
} from "@/components/ui/auth-card";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string }>("/v1/auth/register", {
        method: "POST",
        json: { email, password, displayName: displayName || undefined },
        authToken: null,
      });
      setToken(res.token);
      let sessionOk = await refresh();
      if (!sessionOk) {
        await new Promise((r) => setTimeout(r, 80));
        sessionOk = await refresh();
      }
      if (!sessionOk) {
        clearToken();
        setError(
          "Account created but session check failed. Confirm API + DATABASE_URL (127.0.0.1:5433) and NEXT_PUBLIC_API_URL (127.0.0.1:3001), then restart dev servers."
        );
        return;
      }
      router.replace("/personas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Create your account</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300 hover:underline">
          Log in
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <AuthFieldLabel>Display name</AuthFieldLabel>
          <AuthInput
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <AuthFieldLabel>Email</AuthFieldLabel>
          <AuthInput
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <AuthFieldLabel>Password (min 8)</AuthFieldLabel>
          <AuthInput
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <AuthPrimaryButton type="submit" disabled={loading}>
          {loading ? "Creating…" : "Sign up"}
        </AuthPrimaryButton>
      </form>
    </AuthLayout>
  );
}
