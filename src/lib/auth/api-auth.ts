import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { getUserPermissions } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/permissions";

type AuthSuccess = {
  ok: true;
  userId: string;
  organizationId: string;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

export async function requireApiPermission(
  permission: string,
): Promise<AuthSuccess | AuthFailure> {
  const session = await getSession();

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      ),
    };
  }

  const permissions = await getUserPermissions(session.user.id);
  if (!hasPermission(permissions, permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 },
      ),
    };
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "INVALID_SESSION", message: "User organization missing" } },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    userId: session.user.id,
    organizationId,
  };
}
