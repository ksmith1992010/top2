import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { AUTH_COPY } from "@/lib/auth/auth-copy";
import { middleware } from "@/middleware";

describe("auth UX copy", () => {
  it("includes request access copy", () => {
    expect(AUTH_COPY.requestAccessTitle).toBe("Request access");
    expect(AUTH_COPY.requestAccessReviewNote).toContain("company admin");
    expect(AUTH_COPY.requestAccessSubtitle).toContain("invite");
  });
});

describe("request access public path", () => {
  it("allows request-access without a session cookie", () => {
    const request = new NextRequest("http://localhost:3000/request-access");
    const response = middleware(request);
    expect(response.status).toBe(200);
  });
});
