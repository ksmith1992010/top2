import type { JobStatus } from "@/lib/db/schema/enums";

/** Ordered pipeline stages for forward transitions. */
export const JOB_PIPELINE_ORDER: readonly JobStatus[] = [
  "lead",
  "inspection_scheduled",
  "inspected",
  "claim_filed",
  "adjuster_meeting",
  "approved",
  "work_order",
  "scheduled",
  "installed",
  "collected",
  "closed",
] as const;

const TERMINAL_STATUSES = new Set<JobStatus>(["closed", "lost"]);

export function canTransitionJob(from: JobStatus, to: JobStatus): boolean {
  if (from === to) {
    return false;
  }

  if (TERMINAL_STATUSES.has(from)) {
    return false;
  }

  if (to === "lost") {
    return from !== "closed";
  }

  if (to === "closed") {
    return from === "collected";
  }

  const fromIndex = JOB_PIPELINE_ORDER.indexOf(from);
  const toIndex = JOB_PIPELINE_ORDER.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) {
    return false;
  }

  return toIndex === fromIndex + 1;
}

export function requiresTransitionReason(from: JobStatus, to: JobStatus): boolean {
  if (to === "lost") {
    return true;
  }

  const fromIndex = JOB_PIPELINE_ORDER.indexOf(from);
  const toIndex = JOB_PIPELINE_ORDER.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) {
    return false;
  }

  return toIndex > fromIndex + 1;
}
