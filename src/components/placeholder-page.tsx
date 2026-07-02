import type { NavItem } from "@/lib/nav-config";

export function PlaceholderPage({ item }: { item: Pick<NavItem, "label" | "description" | "comingIn"> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <p className="text-xs font-medium uppercase tracking-wide text-top-gold">Coming soon</p>
      <h1 className="mt-1 text-2xl font-semibold text-top-text">{item.label}</h1>
      <p className="mt-3 text-base text-top-muted">{item.description}</p>
      <p className="mt-6 rounded-xl border border-dashed border-top-border bg-top-card px-4 py-3 text-sm text-top-muted">
        Module ships in <span className="font-medium text-top-text">{item.comingIn}</span>.
      </p>
    </div>
  );
}
