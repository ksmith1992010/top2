const DASHBOARD_METRICS = [
  { label: "Leads", value: "—", trend: "Placeholder" },
  { label: "Inspections", value: "—", trend: "Placeholder" },
  { label: "Claims", value: "—", trend: "Placeholder" },
  { label: "Work orders", value: "—", trend: "Placeholder" },
  { label: "Installs", value: "—", trend: "Placeholder" },
  { label: "Collections", value: "—", trend: "Placeholder" },
] as const;

const PIPELINE_STAGES = [
  { stage: "Lead intake", count: "—" },
  { stage: "Inspection scheduled", count: "—" },
  { stage: "Claim in progress", count: "—" },
  { stage: "Production queue", count: "—" },
  { stage: "Install complete", count: "—" },
] as const;

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-top-accent">
          Operations cockpit
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Command center</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Pipeline visibility and production control for roofing ops. Metrics below are placeholders
          — no CRM data is wired in this PR.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_METRICS.map((metric) => (
          <article key={metric.label} className="command-card p-5">
            <div className="flex items-start justify-between">
              <h2 className="text-sm font-medium text-top-muted">{metric.label}</h2>
              <span className="rounded-full bg-top-surface-raised px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-top-muted">
                {metric.trend}
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-white">{metric.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="command-card lg:col-span-3 p-5 md:p-6">
          <h2 className="text-sm font-semibold text-white">Pipeline snapshot</h2>
          <p className="mt-1 text-xs text-top-muted">Storm restoration workflow — placeholder counts</p>
          <ul className="mt-5 space-y-3">
            {PIPELINE_STAGES.map((item, index) => (
              <li
                key={item.stage}
                className="flex items-center justify-between rounded-lg border border-top-border bg-top-surface-raised/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-top-accent/20 text-xs font-semibold text-top-accent">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-300">{item.stage}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-white">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="command-card lg:col-span-2 p-5 md:p-6">
          <h2 className="text-sm font-semibold text-white">Today&apos;s priorities</h2>
          <p className="mt-1 text-xs text-top-muted">Empty until domain PRs land</p>
          <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-top-border-subtle bg-top-surface-raised/30 px-4 py-10 text-center">
            <svg
              className="h-8 w-8 text-top-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
              />
            </svg>
            <p className="mt-3 text-sm font-medium text-slate-400">No tasks queued</p>
            <p className="mt-1 text-xs text-top-muted">
              Job and lead data will populate this panel in future PRs.
            </p>
          </div>
        </section>
      </div>

      <p className="mt-8 rounded-lg border border-dashed border-top-border-subtle bg-top-surface-raised/30 px-4 py-3 text-center text-xs text-top-muted">
        No CRM data is wired in this PR. Use navigation to preview upcoming modules.
      </p>
    </div>
  );
}
