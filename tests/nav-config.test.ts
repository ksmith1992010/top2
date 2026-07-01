import { describe, expect, it } from "vitest";
import {
  APP_NAV_ITEMS,
  getMobileMoreNavItems,
  getMobilePrimaryNavItems,
  isMoreNavActive,
  isNavActive,
  MOBILE_PRIMARY_NAV_HREFS,
} from "@/lib/nav-config";

describe("nav-config", () => {
  it("defines eight unique section paths", () => {
    const hrefs = APP_NAV_ITEMS.map((item) => item.href);
    expect(hrefs).toHaveLength(8);
    expect(new Set(hrefs).size).toBe(8);
  });

  it("includes the requested workspace sections", () => {
    const labels = APP_NAV_ITEMS.map((item) => item.label);
    expect(labels).toEqual([
      "Dashboard",
      "Leads",
      "Jobs",
      "Production",
      "Calendar",
      "Documents",
      "Reports",
      "Admin",
    ]);
  });

  it("splits mobile primary and more menus without overlap", () => {
    const primary = getMobilePrimaryNavItems();
    const more = getMobileMoreNavItems();

    expect(primary).toHaveLength(MOBILE_PRIMARY_NAV_HREFS.length);
    expect(more).toHaveLength(APP_NAV_ITEMS.length - primary.length);
    expect(primary.length + more.length).toBe(APP_NAV_ITEMS.length);

    const primaryHrefs = new Set(primary.map((item) => item.href));
    for (const item of more) {
      expect(primaryHrefs.has(item.href)).toBe(false);
    }
  });

  it("highlights nested routes for section roots", () => {
    expect(isNavActive("/jobs", "/")).toBe(false);
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/jobs/abc", "/jobs")).toBe(true);
    expect(isMoreNavActive("/admin")).toBe(true);
    expect(isMoreNavActive("/jobs")).toBe(false);
  });
});
