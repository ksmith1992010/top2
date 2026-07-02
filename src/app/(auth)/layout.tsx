import Link from "next/link";
import { AUTH_COPY } from "@/lib/auth/auth-copy";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-command-gradient">
      <div className="pointer-events-none absolute inset-0 bg-gold-glow" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 md:px-8">
        <header className="mb-8">
          <Link href="/login" className="inline-block">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-top-gold">
              {AUTH_COPY.brandName}
            </p>
            <p className="mt-1 text-lg font-semibold text-top-text">{AUTH_COPY.productName}</p>
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center">{children}</main>
        <footer className="mt-8 text-center text-xs text-top-muted">{AUTH_COPY.tagline}</footer>
      </div>
    </div>
  );
}
