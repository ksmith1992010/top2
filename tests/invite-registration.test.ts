import { describe, expect, it } from "vitest";
import { generateInviteToken, hashInviteToken } from "@/lib/invite-tokens";
import { registerWithInviteSchema } from "@/domain/schemas/invite";

describe("invite tokens", () => {
  it("hashes tokens deterministically", () => {
    const token = "test-token-value";
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
    expect(hashInviteToken(token)).not.toBe(hashInviteToken("other"));
  });

  it("generates unique tokens", () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });
});

describe("registerWithInviteSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = registerWithInviteSchema.safeParse({
      token: "a".repeat(20),
      name: "Test User",
      password: "password12345",
      confirmPassword: "different12345",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid input", () => {
    const result = registerWithInviteSchema.safeParse({
      token: "a".repeat(20),
      name: "Test User",
      password: "password12345",
      confirmPassword: "password12345",
    });
    expect(result.success).toBe(true);
  });
});
