import { JOB_STATUSES, type JobStatus } from "@/lib/db/schema/enums";

/** Parse a query/status string into a known JobStatus, or undefined if invalid/empty. */
export function resolveJobStatus(status: string | undefined): JobStatus | undefined {
  if (!status) {
    return undefined;
  }
  return (JOB_STATUSES as readonly string[]).includes(status)
    ? (status as JobStatus)
    : undefined;
}
