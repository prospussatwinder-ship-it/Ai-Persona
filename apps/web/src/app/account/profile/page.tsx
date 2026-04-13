"use client";

import { useAuth } from "@/lib/auth-context";
import { AccountProfileForm } from "../account-settings-forms";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function AccountProfilePage() {
  const { user, refresh } = useAuth();
  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Profile</h1>
      <p className="mt-2 text-sm text-zinc-500">Update how you appear across the platform.</p>
      <Card className="mt-8">
        <CardTitle>Details</CardTitle>
        <CardDescription>Email is managed by your account security settings.</CardDescription>
        <div className="mt-6">
          <AccountProfileForm
            initial={{
              id: user.id,
              email: user.email,
              displayName: user.displayName,
              firstName: user.firstName ?? null,
              lastName: user.lastName ?? null,
              phone: user.phone ?? null,
              avatarUrl: user.avatarUrl ?? null,
            }}
            onSaved={() => void refresh()}
          />
        </div>
      </Card>
    </div>
  );
}
