import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

function isPublicPath(pathname: string): boolean {
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/api/health" ||
    pathname === "/api/register" ||
    pathname.startsWith("/api/invites/validate")
  ) {
    return true;
  }

  if (pathname.startsWith("/api/auth") && pathname !== "/api/auth/me") {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Registration is invite-only. Better Auth's public sign-up endpoint is
  // blocked at the edge; invite registration calls signUpEmail in-process
  // from /api/register, which does not pass through middleware.
  if (pathname.startsWith("/api/auth/sign-up")) {
    return NextResponse.json(
      { error: { code: "SIGNUP_DISABLED", message: "Registration is invite-only" } },
      { status: 403 },
    );
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (sessionCookie) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
