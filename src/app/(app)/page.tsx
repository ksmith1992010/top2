const DASHBOARD_CARDS = [
  {
    title: "Active jobs",
    value: "—",
    note: "Job pipeline arrives in PR-005+",
  },
  {
    title: "Leads to contact",
    value: "—",
    note: "Lead intake arrives in PR-004",
  },
  {
    title: "Today's appointments",
    value: "—",
    note: "Calendar module ships later",
  },
  {
    title: "Production queue",
    value: "—",
    note: "Production board ships later",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-top-muted">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold text-top-navy">Good morning</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Your T.O.P. workspace is ready. Use the navigation to preview upcoming modules — metrics
          below are placeholders until domain PRs land.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_CARDS.map((card) => (
          <article
            key={card.title}
            className="rounded-xl border border-top-border bg-white p-4 shadow-sm"
          >
            <h2 className="text-sm font-medium text-top-muted">{card.title}</h2>
            <p className="mt-2 text-3xl font-semibold text-top-navy">{card.value}</p>
            <p className="mt-3 text-xs text-slate-500">{card.note}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
