import { describe, expect, it } from "vitest";
import {
  assertBearerAuth,
  extractBearerToken,
  timingSafeEqual,
} from "../src/auth.js";
import { AppError } from "../src/errors.js";

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqual("secret-token", "secret-token")).toBe(true);
  });

  it("returns false for different strings of equal length", () => {
    expect(timingSafeEqual("secret-token", "secret-tokem")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(timingSafeEqual("short", "longer-value")).toBe(false);
  });
});

describe("extractBearerToken", () => {
  it("extracts a Bearer token", () => {
    const request = new Request("https://example.com/mcp", {
      headers: { Authorization: "Bearer abc.def-123" },
    });
    expect(extractBearerToken(request)).toBe("abc.def-123");
  });

  it("returns null when Authorization is missing", () => {
    const request = new Request("https://example.com/mcp");
    expect(extractBearerToken(request)).toBeNull();
  });

  it("returns null for non-Bearer schemes", () => {
    const request = new Request("https://example.com/mcp", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    expect(extractBearerToken(request)).toBeNull();
  });
});

describe("assertBearerAuth", () => {
  it("accepts a valid token", () => {
    const request = new Request("https://example.com/mcp", {
      headers: { Authorization: "Bearer correct-token" },
    });
    expect(() => assertBearerAuth(request, "correct-token")).not.toThrow();
  });

  it("rejects a missing token", () => {
    const request = new Request("https://example.com/mcp");
    expect(() => assertBearerAuth(request, "correct-token")).toThrow(AppError);
    try {
      assertBearerAuth(request, "correct-token");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("UNAUTHORIZED");
      expect((error as AppError).status).toBe(401);
    }
  });

  it("rejects an invalid token", () => {
    const request = new Request("https://example.com/mcp", {
      headers: { Authorization: "Bearer wrong-token" },
    });
    expect(() => assertBearerAuth(request, "correct-token")).toThrow(AppError);
  });

  it("fails closed when MCP_BEARER_TOKEN is unset", () => {
    const request = new Request("https://example.com/mcp", {
      headers: { Authorization: "Bearer anything" },
    });
    try {
      assertBearerAuth(request, undefined);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("INTERNAL_ERROR");
    }
  });
});
