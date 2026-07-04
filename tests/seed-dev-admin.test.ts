import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEV_ADMIN_EMAIL,
  DEV_ADMIN_PASSWORD,
  isDevAdminSeedAllowed,
  isProductionSeedContext,
  OWNER_ADMIN_EMAIL,
  resolveDevAdminPassword,
  resolveOwnerAdminPassword,
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

describe("isProductionSeedContext", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false in development", () => {
    expect(isProductionSeedContext({ NODE_ENV: "development" })).toBe(false);
  });

  it("is false on Vercel preview even when NODE_ENV=production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isProductionSeedContext({ NODE_ENV: "production" })).toBe(false);
  });

  it("is true for production deploys", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isProductionSeedContext({ NODE_ENV: "production" })).toBe(true);
  });
});

describe("resolveDevAdminPassword", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses documented default in development", () => {
    expect(resolveDevAdminPassword({ NODE_ENV: "development" }, undefined)).toBe(
      DEV_ADMIN_PASSWORD,
    );
  });

  it("accepts the default as an explicit override outside production", () => {
    expect(resolveDevAdminPassword({ NODE_ENV: "development" }, DEV_ADMIN_PASSWORD)).toBe(
      DEV_ADMIN_PASSWORD,
    );
  });

  it("uses documented default on Vercel preview", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(resolveDevAdminPassword({ NODE_ENV: "production" }, undefined)).toBe(
      DEV_ADMIN_PASSWORD,
    );
  });

  it("requires SEED_ADMIN_PASSWORD in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => resolveDevAdminPassword({ NODE_ENV: "production" }, undefined)).toThrow(
      /SEED_ADMIN_PASSWORD is required/,
    );
  });

  it("rejects the default password in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      resolveDevAdminPassword({ NODE_ENV: "production" }, DEV_ADMIN_PASSWORD),
    ).toThrow(/must not be the default dev password/);
  });

  it("allows explicit production password", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(
      resolveDevAdminPassword({ NODE_ENV: "production" }, "operator-set-production-password"),
    ).toBe("operator-set-production-password");
  });
});

describe("dev admin credentials", () => {
  it("uses documented preview email and password defaults", () => {
    expect(DEV_ADMIN_EMAIL).toBe("admin@example.com");
    expect(DEV_ADMIN_PASSWORD.length).toBeGreaterThanOrEqual(8);
  });
});

describe("resolveOwnerAdminPassword", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the correct owner email", () => {
    expect(OWNER_ADMIN_EMAIL).toBe("kyle.smith@ottrestoration.com");
  });

  it("skips owner admin when no password is set", () => {
    expect(resolveOwnerAdminPassword(undefined)).toBeNull();
  });

  it("rejects the default dev password", () => {
    expect(() => resolveOwnerAdminPassword(DEV_ADMIN_PASSWORD)).toThrow(
      /must not be the default dev password/,
    );
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(() => resolveOwnerAdminPassword("short1!")).toThrow(/at least 8 characters/);
  });

  it("returns an explicitly set password", () => {
    expect(resolveOwnerAdminPassword("seed-test-fixture-password")).toBe(
      "seed-test-fixture-password",
    );
  });

  it("reads only its dedicated env var, never SEED_ADMIN_PASSWORD", () => {
    vi.stubEnv("SEED_ADMIN_PASSWORD", "demo-override-password");
    expect(resolveOwnerAdminPassword()).toBeNull();
  });
});
