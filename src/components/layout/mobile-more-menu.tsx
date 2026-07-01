"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NavIconGlyph } from "@/components/layout/nav-icon";
import { getMobileMoreNavItems, isMoreNavActive, isNavActive } from "@/lib/nav-config";

export function MobileMoreMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const moreActive = isMoreNavActive(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const items = getMobileMoreNavItems();

  return (
    <div className="relative min-w-0 flex-1" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-[44px] w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium ${
          moreActive || open ? "text-top-accent" : "text-top-muted"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeWidth="2" strokeLinecap="round" d="M5 12h14M5 6h14M5 18h14" />
        </svg>
        <span>More</span>
      </button>

      {open ? (
        <div className="absolute bottom-full right-0 mb-2 w-52 rounded-xl border border-top-border bg-white p-2 shadow-lg">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                      active
                        ? "bg-top-accent/10 text-top-accent"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    <NavIconGlyph icon={item.icon} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
