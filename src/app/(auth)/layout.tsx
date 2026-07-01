export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-command-gradient">
      <div className="pointer-events-none absolute inset-0 bg-accent-glow" aria-hidden />
      <div className="relative flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
