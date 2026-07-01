"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";

type AppShellProps = {
  user: {
    email: string;
    name?: string | null;
  };
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-top-surface">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-top-border bg-white px-4 md:px-6">
          <div className="md:hidden">
            <p className="text-sm font-semibold text-top-navy">T.O.P. CRM</p>
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium uppercase tracking-wide text-top-muted">Signed in</p>
            <p className="text-sm font-semibold text-top-navy">Workspace</p>
          </div>
          <UserMenu user={user} />
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
