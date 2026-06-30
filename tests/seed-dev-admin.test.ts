import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEV_ADMIN_EMAIL,
  DEV_ADMIN_PASSWORD,
  isDevAdminSeedAllowed,
} from "@/lib/db/seed-dev-admin";

describe("isDevAdminSeedAllowed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows seeding in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevAdminSeedAllowed({ NODE_ENV: "development" })).toBe(true);
  });

  it("allows seeding in test", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(isDevAdminSeedAllowed({ NODE_ENV: "test" })).toBe(true);
  });

  it("blocks seeding in production by default", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDevAdminSeedAllowed({ NODE_ENV: "production" })).toBe(false);
  });

  it("allows production seeding when SEED_DEV_ADMIN=true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SEED_DEV_ADMIN", "true");
    expect(isDevAdminSeedAllowed({ NODE_ENV: "production" })).toBe(true);
  });

  it("allows seeding on Vercel preview deploys", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isDevAdminSeedAllowed({ NODE_ENV: "production" })).toBe(true);
  });
});

describe("dev admin credentials", () => {
  it("uses documented preview email and password defaults", () => {
    expect(DEV_ADMIN_EMAIL).toBe("admin@example.com");
    expect(DEV_ADMIN_PASSWORD.length).toBeGreaterThanOrEqual(8);
  });
});
