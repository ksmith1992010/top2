import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/db/schema/enums";

export type FormattedActivity = {
  title: string;
  detail: string | null;
};

function statusLabel(value: unknown): string {
  return typeof value === "string" && value in JOB_STATUS_LABELS
    ? JOB_STATUS_LABELS[value as JobStatus]
    : String(value ?? "?");
}

/**
 * Human-readable rendering for a timeline event. Unknown event types fall back
 * to the raw type so new events are visible before this map learns them.
 */
export function formatActivityEvent(
  eventType: string,
  payload: Record<string, unknown>,
): FormattedActivity {
  switch (eventType) {
    case "customer.created": {
      const jobNumber = typeof payload.jobNumber === "string" ? payload.jobNumber : null;
      return {
        title: "Lead created",
        detail: jobNumber ? `Job ${jobNumber} opened` : null,
      };
    }
    case "customer.updated":
      return { title: "Customer details updated", detail: null };
    case "job.updated": {
      const fields = Array.isArray(payload.fields) ? payload.fields.join(", ") : null;
      return {
        title: "Job details updated",
        detail: fields ? `Changed: ${fields}` : null,
      };
    }
    case "job.status_changed": {
      const from = statusLabel(payload.from);
      const to = statusLabel(payload.to);
      const parts: string[] = [];
      if (typeof payload.reason === "string" && payload.reason) {
        parts.push(`Reason: ${payload.reason}`);
      }
      if (Array.isArray(payload.skippedStages) && payload.skippedStages.length > 0) {
        parts.push(`Skipped: ${payload.skippedStages.map(statusLabel).join(", ")}`);
      }
      return {
        title: `Status: ${from} → ${to}`,
        detail: parts.length > 0 ? parts.join(" · ") : null,
      };
    }
    case "user.seeded":
      return { title: "User account provisioned", detail: null };
    default:
      return { title: eventType, detail: null };
  }
}
