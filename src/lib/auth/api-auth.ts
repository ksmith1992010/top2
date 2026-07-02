import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getUserPermissions } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/permissions";

type AuthContext = {
  userId: string;
  organizationId: string;
};

type AuthResolution =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "invalid-session" }
  | ({ status: "ok" } & AuthContext);

async function resolvePermission(permission: string): Promise<AuthResolution> {
  const session = await getSession();

  if (!session) {
    return { status: "unauthenticated" };
  }

  const permissions = await getUserPermissions(session.user.id);
  if (!hasPermission(permissions, permission)) {
    return { status: "forbidden" };
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return { status: "invalid-session" };
  }

  return { status: "ok", userId: session.user.id, organizationId };
}

type AuthSuccess = { ok: true } & AuthContext;

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

export async function requireApiPermission(
  permission: string,
): Promise<AuthSuccess | AuthFailure> {
  const auth = await resolvePermission(permission);

  switch (auth.status) {
    case "unauthenticated":
      return {
        ok: false,
        response: NextResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
          { status: 401 },
        ),
      };
    case "forbidden":
      return {
        ok: false,
        response: NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
          { status: 403 },
        ),
      };
    case "invalid-session":
      return {
        ok: false,
        response: NextResponse.json(
          { error: { code: "INVALID_SESSION", message: "User organization missing" } },
          { status: 403 },
        ),
      };
    case "ok":
      return { ok: true, userId: auth.userId, organizationId: auth.organizationId };
  }
}

/**
 * Server-component guard mirroring requireApiPermission: pages must enforce the
 * same permission as the API routes that back them.
 */
export async function requirePagePermission(permission: string): Promise<AuthContext> {
  const auth = await resolvePermission(permission);

  if (auth.status === "unauthenticated") {
    redirect("/login");
  }
  if (auth.status !== "ok") {
    redirect("/");
  }

  return { userId: auth.userId, organizationId: auth.organizationId };
}
