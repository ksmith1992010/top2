import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerEnv } from "@/lib/env";

describe("getServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses a valid DATABASE_URL", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/top2");
    vi.stubEnv("NODE_ENV", "test");

    expect(getServerEnv()).toEqual({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/top2",
      NODE_ENV: "test",
    });
  });

  it("rejects missing DATABASE_URL", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(() => getServerEnv()).toThrow();
  });
});
