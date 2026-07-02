import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getUserPermissions } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/permissions";

export async function requirePagePermission(permission: string): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.user.id);
  if (!hasPermission(permissions, permission)) {
    redirect("/?error=forbidden");
  }
}
