"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIconGlyph } from "@/components/layout/nav-icon";
import { APP_NAV_ITEMS, isNavActive } from "@/lib/nav-config";

const linkBase =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-top-border bg-white md:flex">
      <div className="border-b border-top-border px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-top-muted">Over The Top</p>
        <p className="text-base font-semibold text-top-navy">Restoration CRM</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Main navigation">
        {APP_NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${linkBase} ${
                active
                  ? "bg-top-accent/10 text-top-accent"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <NavIconGlyph icon={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
