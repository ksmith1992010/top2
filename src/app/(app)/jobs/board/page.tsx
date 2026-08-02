import Link from "next/link";
import { JobsViewToggle } from "@/components/jobs/jobs-view-toggle";
import { listJobsBoard } from "@/domain/queries/list-jobs-board";
import { requirePagePermission } from "@/lib/auth/api-auth";

function boardCountLabel(visible: number, total: number): string {
  if (total === 0) {
    return "0 jobs";
  }
  if (visible >= total) {
    return `${total} job${total === 1 ? "" : "s"} across stages`;
  }
  return `Showing ${visible} of ${total} jobs across stages`;
}

export default async function JobsBoardPage() {
  const auth = await requirePagePermission("jobs:read");
  const board = await listJobsBoard({ organizationId: auth.organizationId });

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-top-gold">Operations</p>
          <h1 className="mt-1 text-2xl font-semibold text-top-text">Pipeline</h1>
          <p className="mt-2 text-sm text-top-muted">
            {boardCountLabel(board.visibleCount, board.totalJobs)} · jobs by stage
          </p>
        </div>
        <JobsViewToggle active="board" />
      </div>

      {board.totalJobs === 0 ? (
        <div className="command-card mx-auto max-w-6xl px-6 py-12 text-center">
          <p className="text-base font-medium text-top-text">No jobs on the board yet</p>
          <p className="mt-2 text-sm text-top-muted">
            Create a lead first, then RoofRun will place the job in New Lead.
          </p>
          <Link
            href="/leads/new"
            className="mt-6 inline-flex rounded-lg bg-top-gold px-4 py-2 text-sm font-semibold text-top-navy"
          >
            New lead
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {board.columns.map((column) => (
            <section
              key={column.status}
              className="flex w-64 shrink-0 flex-col rounded-xl border border-top-border bg-top-surface/40"
              aria-label={`${column.label}, ${column.total} jobs`}
            >
              <header className="border-b border-top-border px-3 py-3">
                <h2 className="text-sm font-medium text-top-text">{column.label}</h2>
                <p className="mt-0.5 text-xs text-top-muted">
                  {column.total === 0
                    ? "Empty"
                    : column.items.length >= column.total
                      ? `${column.total} job${column.total === 1 ? "" : "s"}`
                      : `${column.items.length} of ${column.total}`}
                </p>
              </header>

              <ul className="flex flex-1 flex-col gap-2 p-2">
                {column.items.length === 0 ? (
                  <li className="px-2 py-6 text-center text-xs text-top-muted">No jobs</li>
                ) : (
                  column.items.map((job) => (
                    <li key={job.id}>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="block rounded-lg border border-top-border bg-top-surface-raised px-3 py-2 transition-colors hover:border-top-gold/50"
                      >
                        <p className="text-sm font-medium text-top-gold">{job.jobNumber}</p>
                        <p className="mt-1 truncate text-sm text-top-text">{job.customerName}</p>
                        <p className="mt-0.5 text-xs text-top-muted">
                          {job.city}, {job.state}
                        </p>
                      </Link>
                    </li>
                  ))
                )}
              </ul>

              {column.total > column.items.length ? (
                <div className="border-t border-top-border px-3 py-2">
                  <Link
                    href={`/jobs?status=${column.status}`}
                    className="text-xs text-top-gold hover:underline"
                  >
                    View all {column.total} in list
                  </Link>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
