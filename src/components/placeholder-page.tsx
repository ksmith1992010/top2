import type { NavItem } from "@/lib/nav-config";

export function PlaceholderPage({ item }: { item: Pick<NavItem, "label" | "description" | "comingIn"> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-top-accent">Module preview</p>
      <h1 className="mt-1 text-2xl font-bold text-white">{item.label}</h1>
      <p className="mt-3 text-base leading-relaxed text-slate-400">{item.description}</p>

      <div className="command-card mt-8 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-top-surface-raised text-top-muted">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-300">Coming soon</p>
          <p className="mt-2 text-sm text-top-muted">
            Module ships in{" "}
            <span className="font-medium text-slate-400">{item.comingIn}</span>.
          </p>
        </div>
      </div>

      <p className="mt-6 rounded-lg border border-dashed border-top-border-subtle bg-top-surface-raised/30 px-4 py-3 text-sm text-top-muted">
        No CRM data or APIs are wired in this PR. This page is a layout placeholder for future
        domain work.
      </p>
    </div>
  );
}
