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

const MIN_SEED_PASSWORD_LENGTH = 8;

/** Shared guard: reject values unusable as a real seeded credential. */
function validateSeedPassword(value: string, varName: string): string {
  if (value === DEV_ADMIN_PASSWORD) {
    throw new Error(`${varName} must not be the default dev password.`);
  }
  if (value.length < MIN_SEED_PASSWORD_LENGTH) {
    throw new Error(`${varName} must be at least ${MIN_SEED_PASSWORD_LENGTH} characters.`);
  }
  return value;
}

/**
 * Demo/preview admin password. Outside real production the SEED_ADMIN_PASSWORD
 * override (or the documented default) is used as-is. Real production requires
 * an explicit, non-default SEED_ADMIN_PASSWORD.
 */
export function resolveDevAdminPassword(
  env: Pick<ServerEnv, "NODE_ENV">,
  override: string | undefined = process.env.SEED_ADMIN_PASSWORD,
): string {
  if (isProductionSeedContext(env)) {
    if (!override) {
      throw new Error(
        "SEED_ADMIN_PASSWORD is required when seeding the demo admin in production. Set SEED_DEV_ADMIN=true only with an explicit non-default password.",
      );
    }
    return validateSeedPassword(override, "SEED_ADMIN_PASSWORD");
  }

  return override ?? DEV_ADMIN_PASSWORD;
}

// --- Real owner/operator admin (Over The Top Restoration) ---

export const OWNER_ADMIN_EMAIL = "kyle.smith@ottrestoration.com";
export const OWNER_ADMIN_NAME = "Kyle Smith";

/**
 * The real owner admin is provisioned (in any environment) only when its
 * dedicated SEED_OWNER_ADMIN_PASSWORD is set. This variable is intentionally
 * separate from SEED_ADMIN_PASSWORD so the demo admin can never end up sharing
 * the owner's credential. Returns null to skip owner-admin seeding.
 */
export function resolveOwnerAdminPassword(
  password: string | undefined = process.env.SEED_OWNER_ADMIN_PASSWORD,
): string | null {
  if (!password) {
    return null;
  }
  return validateSeedPassword(password, "SEED_OWNER_ADMIN_PASSWORD");
}
