"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileMoreMenu } from "@/components/layout/mobile-more-menu";
import { NavIconGlyph } from "@/components/layout/nav-icon";
import { getMobilePrimaryNavItems, isNavActive } from "@/lib/nav-config";
import { cn } from "@/lib/cn";

const tabClass =
  "flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium";

export function BottomNav() {
  const pathname = usePathname();
  const primaryItems = getMobilePrimaryNavItems();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-top-border bg-top-navy pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch">
        {primaryItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(tabClass, active ? "text-top-gold" : "text-top-muted")}
              aria-current={active ? "page" : undefined}
            >
              <NavIconGlyph icon={item.icon} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <MobileMoreMenu />
      </div>
    </nav>
  );
}
