"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BRAND_COMPANY,
  BRAND_FULL_NAME,
  BRAND_NAME,
  LOGIN_NEED_ACCOUNT_PROMPT,
  LOGIN_REQUEST_ACCESS_HINT,
  LOGIN_TAGLINE,
  LOGIN_VALUE_BULLETS,
} from "@/lib/auth/auth-copy";
import { authClient } from "@/lib/auth/client";

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-top-accent text-lg font-bold text-white shadow-lg shadow-top-accent/30">
        T
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight text-white">{BRAND_NAME}</p>
        <p className="text-xs text-top-muted">{BRAND_FULL_NAME}</p>
      </div>
    </div>
  );
}

function ValueBullets() {
  return (
    <ul className="mt-8 space-y-3">
      {LOGIN_VALUE_BULLETS.map((bullet) => (
        <li key={bullet} className="flex items-center gap-3 text-sm text-slate-300">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-top-accent/20 text-top-accent">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          {bullet}
        </li>
      ))}
    </ul>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await authClient.signIn.email({
      email,
      password,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "Sign in failed. Check your email and password.");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative hidden flex-1 flex-col justify-between border-r border-top-border bg-top-surface-raised/50 p-10 lg:flex xl:p-14">
        <BrandMark />
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-top-accent">
            {BRAND_COMPANY}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white xl:text-4xl">
            {LOGIN_TAGLINE}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Your roofing operations command center — pipeline visibility, production control, and
            team accountability in one workspace.
          </p>
          <ValueBullets />
        </div>
        <p className="text-xs text-top-muted">
          Storm restoration · Pipeline visibility · Production control
        </p>
      </section>

      <section className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:max-w-lg lg:px-12 xl:max-w-xl xl:px-16">
        <div className="mb-8 lg:hidden">
          <BrandMark />
          <p className="mt-4 text-sm font-medium text-slate-300">{LOGIN_TAGLINE}</p>
        </div>

        <div className="command-card-raised p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">Sign in</h2>
          <p className="mt-1 text-sm text-top-muted">Access your T.O.P. workspace</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="auth-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`auth-input ${error ? "auth-input-error" : ""}`}
                placeholder="you@company.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`auth-input pr-10 ${error ? "auth-input-error" : ""}`}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-top-muted transition-colors hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
              >
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={isSubmitting} className="auth-button-primary">
              {isSubmitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-top-border pt-6">
            <p className="text-sm text-slate-400">{LOGIN_NEED_ACCOUNT_PROMPT}</p>
            <Link
              href="/request-access"
              className="mt-2 inline-block text-sm font-medium text-top-accent transition-colors hover:text-red-400"
            >
              Request access →
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-top-muted lg:text-left">
          {LOGIN_REQUEST_ACCESS_HINT}
        </p>
      </section>
    </main>
  );
}
