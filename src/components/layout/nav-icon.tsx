import type { NavIcon } from "@/lib/nav-config";

const iconClass = "h-5 w-5 shrink-0";

export function NavIconGlyph({ icon }: { icon: NavIcon }) {
  switch (icon) {
    case "dashboard":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h7v7H4zM13 6h7v4h-7zM13 12h7v6h-7zM4 15h7v3H4z" />
        </svg>
      );
    case "leads":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "jobs":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      );
    case "production":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "documents":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
    case "reports":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-4" />
        </svg>
      );
    case "admin":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.03 1.39 1.15H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
}
