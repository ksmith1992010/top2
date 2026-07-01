import { NextResponse } from "next/server";
import type { Session } from "@/lib/auth/auth";
import { getSession } from "@/lib/auth/server";
import { getUserRolesAndPermissions } from "@/lib/auth/roles";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  const roles = await getUserRolesAndPermissions(session.user.id);

  const user = session.user as Session["user"];

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
    },
    roles,
  });
}
