import type { NavItem } from "@/lib/nav-config";

export function PlaceholderPage({ item }: { item: Pick<NavItem, "label" | "description" | "comingIn"> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <p className="text-xs font-medium uppercase tracking-wide text-top-muted">Coming soon</p>
      <h1 className="mt-1 text-2xl font-semibold text-top-navy">{item.label}</h1>
      <p className="mt-3 text-base text-slate-600">{item.description}</p>
      <p className="mt-6 rounded-lg border border-dashed border-top-border bg-white px-4 py-3 text-sm text-top-muted">
        Module ships in <span className="font-medium text-slate-700">{item.comingIn}</span>. No CRM
        data or APIs are wired in this PR.
      </p>
    </div>
  );
}
