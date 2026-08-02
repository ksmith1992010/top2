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
  /** Short operator-facing note for modules that are not live yet. */
  comingIn: string;
};

/** Full sidebar navigation — single source of truth for app sections. */
export const APP_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: "dashboard",
    description: "Daily priorities for the crew and office.",
    comingIn: "Overview",
  },
  {
    label: "Leads",
    href: "/leads",
    icon: "leads",
    description: "Prospects and intake before a job is created.",
    comingIn: "Live",
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: "jobs",
    description: "Job lifecycle — status, timeline, and assignments.",
    comingIn: "Live",
  },
  {
    label: "Production",
    href: "/production",
    icon: "production",
    description: "Install schedule and field execution.",
    comingIn: "Installs",
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: "calendar",
    description: "Inspections, adjusters, and crew appointments.",
    comingIn: "Schedule",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: "documents",
    description: "Contracts, photos, and job files.",
    comingIn: "Files",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "reports",
    description: "KU, CI, and operational reporting.",
    comingIn: "KU / CI",
  },
  {
    label: "Admin",
    href: "/admin",
    icon: "admin",
    description: "Users, roles, and organization settings.",
    comingIn: "Team",
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
