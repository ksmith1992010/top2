import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  LOGIN_TAGLINE,
  LOGIN_VALUE_BULLETS,
  REQUEST_ACCESS_HEADING,
  REQUEST_ACCESS_REVIEW_NOTE,
} from "@/lib/auth/auth-copy";
import { APP_NAV_ITEMS } from "@/lib/nav-config";
import { middleware } from "@/middleware";

describe("auth UX copy", () => {
  it("includes login tagline and value bullets", () => {
    expect(LOGIN_TAGLINE).toBe("Run every roof from lead to paid.");
    expect(LOGIN_VALUE_BULLETS).toHaveLength(5);
    expect(LOGIN_VALUE_BULLETS).toContain("Sales pipeline");
    expect(LOGIN_VALUE_BULLETS).toContain("Team accountability");
  });

  it("includes request access headings", () => {
    expect(REQUEST_ACCESS_HEADING).toBe("Request access");
    expect(REQUEST_ACCESS_REVIEW_NOTE).toContain("company admin");
  });
});

describe("auth middleware public paths", () => {
  it("allows login without a session cookie", () => {
    const request = new NextRequest("http://localhost:3000/login");
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("allows request-access without a session cookie", () => {
    const request = new NextRequest("http://localhost:3000/request-access");
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("still redirects protected pages to login", () => {
    const request = new NextRequest("http://localhost:3000/");
    const response = middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });
});

describe("app shell nav config", () => {
  it("still defines all workspace sections for shell rendering", () => {
    expect(APP_NAV_ITEMS.length).toBeGreaterThanOrEqual(8);
    expect(APP_NAV_ITEMS.map((item) => item.label)).toContain("Dashboard");
    expect(APP_NAV_ITEMS.map((item) => item.label)).toContain("Jobs");
  });
});
