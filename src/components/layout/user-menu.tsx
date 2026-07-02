"use client";

import { LogoutButton } from "@/components/logout-button";

type UserMenuProps = {
  user: {
    email: string;
    name?: string | null;
  };
};

export function UserMenu({ user }: UserMenuProps) {
  const displayName = user.name?.trim() || user.email.split("@")[0];

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-top-text">{displayName}</p>
        <p className="text-xs text-top-muted">{user.email}</p>
      </div>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-top-gold text-sm font-semibold text-top-navy sm:hidden"
        aria-hidden
      >
        {displayName.charAt(0).toUpperCase()}
      </div>
      <LogoutButton className="auth-button-secondary !w-auto px-3 py-2" />
    </div>
  );
}
