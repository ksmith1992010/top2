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

/** True when seed runs in real production (not Vercel preview/dev). */
export function isProductionSeedContext(env: Pick<ServerEnv, "NODE_ENV">): boolean {
  if (env.NODE_ENV !== "production") {
    return false;
  }

  const vercelEnv = process.env.VERCEL_ENV;
  return vercelEnv !== "preview" && vercelEnv !== "development";
}

export const DEV_ADMIN_EMAIL = "admin@example.com";
export const DEV_ADMIN_NAME = "Preview Admin";
export const DEV_ADMIN_PASSWORD = "password12345";

export function resolveDevAdminPassword(
  env: Pick<ServerEnv, "NODE_ENV" | "SEED_ADMIN_PASSWORD">,
): string {
  if (isProductionSeedContext(env)) {
    if (!env.SEED_ADMIN_PASSWORD) {
      throw new Error(
        "SEED_ADMIN_PASSWORD is required when seeding dev admin in production. Set SEED_DEV_ADMIN=true only with an explicit non-default password.",
      );
    }

    if (env.SEED_ADMIN_PASSWORD === DEV_ADMIN_PASSWORD) {
      throw new Error("The default dev password cannot be used in production.");
    }

    return env.SEED_ADMIN_PASSWORD;
  }

  return env.SEED_ADMIN_PASSWORD ?? DEV_ADMIN_PASSWORD;
}
