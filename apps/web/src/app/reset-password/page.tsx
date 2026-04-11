import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

function ResetFallback() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-sm text-zinc-400">Loading…</div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
