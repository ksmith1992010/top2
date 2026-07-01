"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      Sign out
    </button>
  );
}
