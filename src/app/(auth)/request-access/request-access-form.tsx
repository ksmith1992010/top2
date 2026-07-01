"use client";

import { FormEvent, useState } from "react";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import {
  BRAND_FULL_NAME,
  BRAND_NAME,
  REQUEST_ACCESS_HEADING,
  REQUEST_ACCESS_REVIEW_NOTE,
  REQUEST_ACCESS_SUBHEADING,
  REQUEST_ACCESS_SUCCESS_MESSAGE,
} from "@/lib/auth/auth-copy";

type FormFields = {
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  note: string;
};

const EMPTY_FORM: FormFields = {
  fullName: "",
  email: "",
  companyName: "",
  role: "",
  note: "",
};

export default function RequestAccessForm() {
  const [fields, setFields] = useState<FormFields>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="command-card-raised w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white">Request received</h1>
          <p className="mt-2 text-sm text-slate-400">{REQUEST_ACCESS_SUCCESS_MESSAGE}</p>
          <p className="mt-4 text-xs text-top-muted">{REQUEST_ACCESS_REVIEW_NOTE}</p>
          <div className="mt-6">
            <AuthBackLink href="/login">Back to sign in</AuthBackLink>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="command-card-raised w-full max-w-md p-6 sm:p-8">
        <AuthBackLink href="/login">Back to sign in</AuthBackLink>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-top-accent">
            {BRAND_NAME} · {BRAND_FULL_NAME}
          </p>
          <h1 className="mt-2 text-xl font-semibold text-white">{REQUEST_ACCESS_HEADING}</h1>
          <p className="mt-2 text-sm text-slate-400">{REQUEST_ACCESS_SUBHEADING}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="auth-label">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              autoComplete="name"
              value={fields.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              className="auth-input"
              placeholder="Jane Smith"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="auth-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={fields.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="auth-input"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="companyName" className="auth-label">
              Company name
            </label>
            <input
              id="companyName"
              type="text"
              required
              value={fields.companyName}
              onChange={(event) => updateField("companyName", event.target.value)}
              className="auth-input"
              placeholder="Over The Top Restoration"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="role" className="auth-label">
              Role / job title
            </label>
            <input
              id="role"
              type="text"
              required
              value={fields.role}
              onChange={(event) => updateField("role", event.target.value)}
              className="auth-input"
              placeholder="Production manager"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="note" className="auth-label">
              Short note
            </label>
            <textarea
              id="note"
              rows={3}
              value={fields.note}
              onChange={(event) => updateField("note", event.target.value)}
              className="auth-input resize-none"
              placeholder="Why you need access and which team you're on…"
            />
          </div>

          <button type="submit" className="auth-button-primary">
            Submit request
          </button>
        </form>

        <p className="mt-4 text-xs text-top-muted">{REQUEST_ACCESS_REVIEW_NOTE}</p>
      </div>
    </main>
  );
}
