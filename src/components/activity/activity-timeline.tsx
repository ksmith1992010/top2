import { formatActivityEvent } from "@/domain/activity-format";
import type { ActivityItem } from "@/domain/queries/list-activity";

export function ActivityTimeline({ events }: { events: ActivityItem[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No activity yet. Changes to this record will appear here.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const formatted = formatActivityEvent(event.eventType, event.payload);
        return (
          <li key={event.id} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-top-navy/40" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">{formatted.title}</p>
              {formatted.detail ? (
                <p className="mt-0.5 text-sm text-slate-600">{formatted.detail}</p>
              ) : null}
              <p className="mt-0.5 text-xs text-top-muted">
                {event.actorName} ·{" "}
                {new Date(event.occurredAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
