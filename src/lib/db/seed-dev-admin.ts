import type { ServerEnv } from "@/lib/env";

/**
 * Dev/preview admin seeding is allowed in non-production environments,
 * Vercel preview/development deploys, or when explicitly enabled via SEED_DEV_ADMIN=true.
 * Production deploys never get a demo admin unless an operator runs seed with that flag.
 */
export function isDevAdminSeedAllowed(env: Pick<ServerEnv, "NODE_ENV">): boolean {
  if (env.NODE_ENV !== "production") {
    return true;
  }

  if (process.env.SEED_DEV_ADMIN === "true") {
    return true;
  }

  const vercelEnv = process.env.VERCEL_ENV;
  return vercelEnv === "preview" || vercelEnv === "development";
}

export const DEV_ADMIN_EMAIL = "admin@example.com";
export const DEV_ADMIN_NAME = "Preview Admin";
export const DEV_ADMIN_PASSWORD = "password12345";
