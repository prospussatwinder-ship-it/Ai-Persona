"use client";

import { AccountChangePasswordForm } from "../account-settings-forms";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function AccountSecurityPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Security</h1>
      <p className="mt-2 text-sm text-zinc-500">Protect your account with a strong password.</p>

      <Card className="mt-8">
        <CardTitle>Password</CardTitle>
        <CardDescription>Change your password while staying logged in.</CardDescription>
        <div className="mt-6">
          <AccountChangePasswordForm />
        </div>
      </Card>

      <p className="mt-8 text-sm text-zinc-500">
        Forgot your password?{" "}
        <Link href="/forgot-password" className="text-violet-400 hover:underline">
          Request a reset link
        </Link>
        .
      </p>
    </div>
  );
}
