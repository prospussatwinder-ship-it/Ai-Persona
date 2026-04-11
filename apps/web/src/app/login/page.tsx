import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-sm text-zinc-400 sm:px-6">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
