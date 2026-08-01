import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isDevAdminSeedAllowed, resolveDevAdminPassword } from "@/lib/db/seed-dev-admin";
import { runSeed } from "@/lib/db/run-seed";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Temporary operator-only bootstrap for environments where DATABASE_URL is a
 * Netlify secret (unreadable via CLI). Requires SEED_DEV_ADMIN=true and
 * Authorization: Bearer $SEED_ADMIN_PASSWORD. Remove after first successful seed.
 */
export async function POST(request: Request) {
  const env = getServerEnv();

  if (!isDevAdminSeedAllowed(env) || process.env.SEED_DEV_ADMIN !== "true") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Seed bootstrap is disabled" } },
      { status: 403 },
    );
  }

  let adminPassword: string;
  try {
    adminPassword = resolveDevAdminPassword(env);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "MISCONFIGURED",
          message: error instanceof Error ? error.message : "Invalid seed configuration",
        },
      },
      { status: 400 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!token || token !== adminPassword) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid bootstrap token" } },
      { status: 401 },
    );
  }

  const result = await runSeed(getDb(), env);

  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    action: result.admin,
    email: result.email ?? null,
  });
}
