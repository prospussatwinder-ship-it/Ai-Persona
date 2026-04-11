"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api-error";
import { apiFetch, clearToken, setToken } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { getApiBase } from "@/lib/config";
import {
  AuthFieldLabel,
  AuthInput,
  AuthLayout,
  AuthPrimaryButton,
} from "@/components/ui/auth-card";

function isStaffRole(role: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "OPERATOR";
}

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{
        token?: string;
        accessToken?: string;
        user?: { role: string };
      }>("/v1/auth/login", {
        method: "POST",
        json: { email, password },
        authToken: null,
      });
      const token = res.token ?? res.accessToken;
      if (!token) {
        setError("Login response missing token — check API /v1/auth/login.");
        return;
      }
      setToken(token);
      let sessionOk = await refresh();
      if (!sessionOk) {
        await new Promise((r) => setTimeout(r, 80));
        sessionOk = await refresh();
      }
      if (!sessionOk) {
        clearToken();
        setError(
          "Login succeeded but verifying the session failed. Check: (1) API running on port 3001, (2) apps/web/.env.local has NEXT_PUBLIC_API_URL=http://127.0.0.1:3001, (3) apps/api/.env DATABASE_URL points at Docker Postgres (127.0.0.1:5433). Then restart dev:api and dev:web."
        );
        return;
      }
      const next = search.get("next");
      if (next && next.startsWith("/")) {
        router.replace(next);
      } else if (res.user && isStaffRole(res.user.role)) {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/personas");
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setError(
          `${err.message} Using API base: ${getApiBase()} — set NEXT_PUBLIC_API_URL in apps/web/.env.local to your Nest URL (default http://localhost:3001), then restart next dev.`
        );
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-zinc-400">
        New here?{" "}
        <Link href="/register" className="font-medium text-violet-400 hover:text-violet-300 hover:underline">
          Create an account
        </Link>
        {" · "}
        <Link href="/forgot-password" className="text-zinc-500 hover:text-zinc-300 hover:underline">
          Forgot password
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
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
          <AuthFieldLabel>Password</AuthFieldLabel>
          <AuthInput
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <AuthPrimaryButton type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </AuthPrimaryButton>
      </form>
    </AuthLayout>
  );
}
