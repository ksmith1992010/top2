import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "@/middleware";

describe("middleware", () => {
  it("allows public health checks without a session cookie", () => {
    const request = new NextRequest("http://localhost:3000/api/health");
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("allows signup page without a session cookie", () => {
    const request = new NextRequest("http://localhost:3000/signup?token=abc");
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("allows invite validation API without a session cookie", () => {
    const request = new NextRequest(
      "http://localhost:3000/api/invites/validate?token=abc",
    );
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("returns 401 for protected API routes without a session cookie", () => {
    const request = new NextRequest("http://localhost:3000/api/admin/users");
    const response = middleware(request);
    expect(response.status).toBe(401);
  });

  it("redirects protected pages to login", () => {
    const request = new NextRequest("http://localhost:3000/");
    const response = middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("redirects protected section routes to login", () => {
    const request = new NextRequest("http://localhost:3000/leads");
    const response = middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });
});
