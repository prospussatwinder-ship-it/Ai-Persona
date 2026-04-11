"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/auth";
import {
  AuthFieldLabel,
  AuthInput,
  AuthLayout,
  AuthPrimaryButton,
} from "@/components/ui/auth-card";

export function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await apiFetch("/v1/auth/reset-password", {
        method: "POST",
        json: { token, password },
        authToken: null,
      });
      router.push("/login");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Set a new password</h1>
      <p className="mt-2 text-sm text-zinc-400">
        <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300 hover:underline">
          Back to login
        </Link>
      </p>
      {!token ? (
        <p className="mt-6 text-sm text-red-400">Missing token in URL.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <AuthFieldLabel>New password (min 10)</AuthFieldLabel>
            <AuthInput
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err ? <p className="text-sm text-red-400">{err}</p> : null}
          <AuthPrimaryButton type="submit" disabled={loading}>
            {loading ? "Saving…" : "Update password"}
          </AuthPrimaryButton>
        </form>
      )}
    </AuthLayout>
  );
}
