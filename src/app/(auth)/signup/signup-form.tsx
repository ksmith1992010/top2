"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AUTH_COPY } from "@/lib/auth/auth-copy";
import { authClient } from "@/lib/auth/client";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadingInvite(false);
      return;
    }

    async function validate() {
      try {
        const response = await fetch(
          `/api/invites/validate?token=${encodeURIComponent(token)}`,
        );
        const data = await response.json();
        if (!response.ok) {
          setError(data.error?.message ?? "Invalid or expired invite");
          setLoadingInvite(false);
          return;
        }
        setError(null);
        setEmail(data.email);
        setOrganizationName(data.organizationName);
        setLoadingInvite(false);
      } catch {
        setError("Could not validate invite");
        setLoadingInvite(false);
      }
    }

    void validate();
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password, confirmPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? "Registration failed");
        return;
      }

      const signIn = await authClient.signIn.email({
        email: data.user.email,
        password,
      });

      if (signIn.error) {
        setError("Account created. Sign in with your new password.");
        router.replace("/login");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-top-text">{AUTH_COPY.signupTitle}</h1>
        <p className="mt-3 text-sm text-top-muted">
          Account creation requires an invite link from your administrator.
        </p>
        <p className="mt-6 text-sm text-top-muted">
          <Link href="/login" className="text-top-gold hover:text-top-gold-hover">
            Back to sign in
          </Link>
        </p>
      </Card>
    );
  }

  if (loadingInvite) {
    return (
      <Card className="w-full max-w-md animate-pulse p-8 text-sm text-top-muted">
        Validating invite…
      </Card>
    );
  }

  if (error && !email) {
    return (
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-top-text">Invite unavailable</h1>
        <p className="mt-3 text-sm text-red-400">{error}</p>
        <p className="mt-6 text-sm text-top-muted">
          <Link href="/login" className="text-top-gold hover:text-top-gold-hover">
            Back to sign in
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-xl font-semibold text-top-text">{AUTH_COPY.signupTitle}</h1>
      {organizationName ? (
        <p className="mt-2 text-sm text-top-muted">Joining {organizationName}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email ?? ""} disabled />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            hasError={Boolean(error)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hasError={Boolean(error)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            hasError={Boolean(error)}
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-top-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-top-gold hover:text-top-gold-hover">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
