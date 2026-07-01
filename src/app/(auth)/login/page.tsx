import { Suspense } from "react";
import LoginForm from "./login-form";

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-top-muted">Loading sign in…</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
