const DASHBOARD_CARDS = [
  {
    title: "Jobs in motion",
    value: "—",
    note: "Pipeline counts land with the jobs board.",
  },
  {
    title: "Open intakes",
    value: "—",
    note: "Lead counts wire up next.",
  },
  {
    title: "Today's appointments",
    value: "—",
    note: "Schedule is not wired yet.",
  },
  {
    title: "Production queue",
    value: "—",
    note: "Install board ships later.",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-top-gold">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold text-top-text">Ready for today</h1>
        <p className="mt-2 max-w-2xl text-sm text-top-muted">
          Track every roof from lead to paid. Storm leads, inspections, and installs in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_CARDS.map((card) => (
          <article key={card.title} className="command-card">
            <h2 className="text-sm font-medium text-top-muted">{card.title}</h2>
            <p className="mt-2 text-3xl font-semibold text-top-text">{card.value}</p>
            <p className="mt-3 text-xs text-top-muted">{card.note}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
