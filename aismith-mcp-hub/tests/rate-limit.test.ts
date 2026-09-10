import { afterEach, describe, expect, it } from "vitest";
import {
  InMemoryRateLimiter,
  enforceRateLimit,
  resetRateLimitersForTests,
} from "../src/rate-limit.js";
import { AppError } from "../src/errors.js";

describe("InMemoryRateLimiter", () => {
  afterEach(() => {
    resetRateLimitersForTests();
  });

  it("allows requests under the limit", () => {
    const limiter = new InMemoryRateLimiter(3, 60_000);
    expect(limiter.check("ip:1").allowed).toBe(true);
    expect(limiter.check("ip:1").allowed).toBe(true);
    expect(limiter.check("ip:1").allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const limiter = new InMemoryRateLimiter(2, 60_000);
    expect(limiter.check("ip:2").allowed).toBe(true);
    expect(limiter.check("ip:2").allowed).toBe(true);
    const blocked = limiter.check("ip:2");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("enforceRateLimit throws RATE_LIMITED", () => {
    resetRateLimitersForTests();
    const request = new Request("https://example.com/mcp", {
      headers: { "cf-connecting-ip": "203.0.113.10" },
    });

    enforceRateLimit(request, 1, 60_000);
    try {
      enforceRateLimit(request, 1, 60_000);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("RATE_LIMITED");
      expect((error as AppError).status).toBe(429);
    }
  });
});
