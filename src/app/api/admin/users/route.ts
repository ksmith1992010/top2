import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { getUserPermissions } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/permissions";

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  const permissions = await getUserPermissions(session.user.id);
  if (!hasPermission(permissions, "users:create")) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
      { status: 403 },
    );
  }

  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "User admin API arrives in a later PR" } },
    { status: 501 },
  );
}
