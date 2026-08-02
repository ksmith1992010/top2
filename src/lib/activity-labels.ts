import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/db/schema/enums";
import { resolveJobStatus } from "@/lib/job-status";

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function statusLabel(value: unknown): string {
  if (typeof value !== "string") {
    return "Unknown";
  }
  const status = resolveJobStatus(value);
  return status ? JOB_STATUS_LABELS[status as JobStatus] : value;
}

/** Human-readable summary for a known activity event. Never dumps raw payload. */
export function formatActivitySummary(eventType: string, payload: unknown): string {
  const data = asRecord(payload);

  switch (eventType) {
    case "customer.created":
      return "Lead created";
    case "customer.updated":
      return "Customer details updated";
    case "job.status_changed":
      return `Status changed from ${statusLabel(data.from)} to ${statusLabel(data.to)}`;
    default:
      return "Activity recorded";
  }
}
