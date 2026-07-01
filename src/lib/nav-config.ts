export type NavIcon =
  | "dashboard"
  | "leads"
  | "jobs"
  | "production"
  | "calendar"
  | "documents"
  | "reports"
  | "admin";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
  description: string;
  comingIn: string;
};

/** Full sidebar navigation — single source of truth for app sections. */
export const APP_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: "dashboard",
    description: "Pipeline overview and daily priorities.",
    comingIn: "PR-004+",
  },
  {
    label: "Leads",
    href: "/leads",
    icon: "leads",
    description: "Prospects and intake before job creation.",
    comingIn: "PR-004",
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: "jobs",
    description: "Job lifecycle hub — status, timeline, and assignments.",
    comingIn: "PR-005+",
  },
  {
    label: "Production",
    href: "/production",
    icon: "production",
    description: "Production board and field execution.",
    comingIn: "Later PR",
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: "calendar",
    description: "Appointments and schedule.",
    comingIn: "Later PR",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: "documents",
    description: "Contracts, photos, and job files.",
    comingIn: "Later PR",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "reports",
    description: "KU, CI, and operational reporting.",
    comingIn: "Later PR",
  },
  {
    label: "Admin",
    href: "/admin",
    icon: "admin",
    description: "Users, roles, and organization settings.",
    comingIn: "Later PR",
  },
];

/** Primary bottom tabs on mobile (max 4 + More). */
export const MOBILE_PRIMARY_NAV_HREFS = ["/", "/leads", "/jobs", "/calendar"] as const;

export function getMobilePrimaryNavItems(): NavItem[] {
  return APP_NAV_ITEMS.filter((item) =>
    (MOBILE_PRIMARY_NAV_HREFS as readonly string[]).includes(item.href),
  );
}

export function getMobileMoreNavItems(): NavItem[] {
  return APP_NAV_ITEMS.filter(
    (item) => !(MOBILE_PRIMARY_NAV_HREFS as readonly string[]).includes(item.href),
  );
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isMoreNavActive(pathname: string): boolean {
  return getMobileMoreNavItems().some((item) => isNavActive(pathname, item.href));
}

export function getNavItemByHref(href: string): NavItem | undefined {
  return APP_NAV_ITEMS.find((item) => item.href === href);
}
