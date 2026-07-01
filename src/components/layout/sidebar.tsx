"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIconGlyph } from "@/components/layout/nav-icon";
import { APP_NAV_ITEMS, isNavActive } from "@/lib/nav-config";

const linkBase =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-top-border bg-top-surface-raised md:flex">
      <div className="border-b border-top-border px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-top-accent text-sm font-bold text-white">
            T
          </div>
          <div>
            <p className="text-sm font-bold text-white">T.O.P.</p>
            <p className="text-[10px] text-top-muted">Total Operations Platform</p>
          </div>
        </div>
        <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-top-muted">
          Over The Top Restoration
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Main navigation">
        {APP_NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${linkBase} ${
                active
                  ? "border-l-2 border-top-accent bg-top-accent/10 pl-[10px] text-white"
                  : "border-l-2 border-transparent text-slate-400 hover:bg-top-surface-card hover:text-slate-200"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <NavIconGlyph icon={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-top-border p-4">
        <p className="text-[10px] leading-relaxed text-top-muted">
          Storm restoration · Pipeline visibility
        </p>
      </div>
    </aside>
  );
}
