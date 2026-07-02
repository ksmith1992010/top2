import { Suspense } from "react";
import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="command-card w-full max-w-md animate-pulse p-8 text-sm text-top-muted">
          Loading…
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
