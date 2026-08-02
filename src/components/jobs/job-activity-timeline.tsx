import type { JobActivityItem } from "@/domain/queries/list-job-activity";

type JobActivityTimelineProps = {
  items: JobActivityItem[];
  total: number;
};

function countLabel(visible: number, total: number): string {
  if (total === 0) {
    return "No activity yet";
  }
  if (visible >= total) {
    return `${total} event${total === 1 ? "" : "s"}`;
  }
  return `Showing ${visible} of ${total} events`;
}

export function JobActivityTimeline({ items, total }: JobActivityTimelineProps) {
  return (
    <section className="command-card">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-top-text">Activity</h2>
        <p className="text-xs text-top-muted">{countLabel(items.length, total)}</p>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-top-muted">
          Status changes and lead updates will show here.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="border-l border-top-border pl-4">
              <p className="text-sm text-top-text">{item.summary}</p>
              <p className="mt-1 text-xs text-top-muted">
                {new Date(item.occurredAt).toLocaleString()}
                {item.actorName ? ` · ${item.actorName}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
