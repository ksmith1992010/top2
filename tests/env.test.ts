import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerEnv } from "@/lib/env";

describe("getServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses a valid DATABASE_URL and auth defaults in test", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/top2");
    vi.stubEnv("NODE_ENV", "test");

    expect(getServerEnv()).toEqual({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/top2",
      NODE_ENV: "test",
      BETTER_AUTH_SECRET: "development-only-secret-at-least-32-characters",
      BETTER_AUTH_URL: "http://localhost:3000",
      SEED_ADMIN_PASSWORD: undefined,
    });
  });

  it("rejects missing DATABASE_URL", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(() => getServerEnv()).toThrow();
  });
});
