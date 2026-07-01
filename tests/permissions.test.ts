import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/permissions";

describe("hasPermission", () => {
  it("grants all permissions when * is present", () => {
    expect(hasPermission(["*"], "jobs:create")).toBe(true);
  });

  it("grants resource wildcard permissions", () => {
    expect(hasPermission(["jobs:*"], "jobs:transition")).toBe(true);
    expect(hasPermission(["jobs:*"], "invoices:create")).toBe(false);
  });

  it("grants exact permission matches", () => {
    expect(hasPermission(["jobs:read", "customers:read"], "jobs:read")).toBe(true);
    expect(hasPermission(["jobs:read"], "jobs:create")).toBe(false);
  });

  it("rejects malformed required permissions", () => {
    expect(hasPermission(["jobs:read"], "jobs")).toBe(false);
  });
});
