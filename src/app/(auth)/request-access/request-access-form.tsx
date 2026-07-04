"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AUTH_COPY } from "@/lib/auth/auth-copy";

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

function BackToSignIn() {
  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 text-sm text-top-muted transition-colors hover:text-top-text"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back to sign in
    </Link>
  );
}

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
      <Card className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-top-text">Request received</h1>
        <p className="mt-2 text-sm text-top-muted">{AUTH_COPY.requestAccessSuccess}</p>
        <p className="mt-4 text-xs text-top-muted">{AUTH_COPY.requestAccessReviewNote}</p>
        <div className="mt-6">
          <BackToSignIn />
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <BackToSignIn />

      <h1 className="mt-6 text-xl font-semibold text-top-text">{AUTH_COPY.requestAccessTitle}</h1>
      <p className="mt-2 text-sm text-top-muted">{AUTH_COPY.requestAccessSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            required
            autoComplete="name"
            value={fields.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={fields.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="companyName">Company</Label>
          <Input
            id="companyName"
            required
            autoComplete="organization"
            value={fields.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            placeholder="Sales, production, accounting…"
            value={fields.role}
            onChange={(e) => updateField("role", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="note">Anything else?</Label>
          <textarea
            id="note"
            rows={3}
            className="auth-input resize-none"
            value={fields.note}
            onChange={(e) => updateField("note", e.target.value)}
          />
        </div>
        <Button type="submit">Request access</Button>
      </form>

      <p className="mt-6 text-center text-xs text-top-muted">{AUTH_COPY.requestAccessReviewNote}</p>
    </Card>
  );
}
