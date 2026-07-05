import { JOB_STATUSES, type JobStatus } from "@/lib/db/schema/enums";

/**
 * The single job status state machine (BLUEPRINT appendix "Job transitions").
 * All status changes go through TransitionJobCommand, which calls this module.
 *
 * Rules:
 * - Forward by one stage: always allowed, no reason needed.
 * - Forward skipping stages (e.g. retail jobs skipping the insurance stages):
 *   allowed, but requires a non-empty reason; skipped stages are recorded.
 * - Backward: admin permission (`jobs:transition:admin`) + reason, always.
 * - No silent auto-advance from events.
 */
export const JOB_PIPELINE_ORDER: readonly JobStatus[] = JOB_STATUSES;

export type TransitionCheck =
  | {
      ok: true;
      direction: "forward" | "backward";
      skippedStages: JobStatus[];
      requiresReason: boolean;
      requiresAdmin: boolean;
    }
  | {
      ok: false;
      code: "NO_CHANGE" | "UNKNOWN_STATUS";
      message: string;
    };

export function checkTransition(from: JobStatus, to: JobStatus): TransitionCheck {
  if (from === to) {
    return { ok: false, code: "NO_CHANGE", message: "Job is already in that status" };
  }

  const fromIndex = JOB_PIPELINE_ORDER.indexOf(from);
  const toIndex = JOB_PIPELINE_ORDER.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) {
    return { ok: false, code: "UNKNOWN_STATUS", message: "Unknown job status" };
  }

  if (toIndex > fromIndex) {
    const skippedStages = JOB_PIPELINE_ORDER.slice(fromIndex + 1, toIndex) as JobStatus[];
    return {
      ok: true,
      direction: "forward",
      skippedStages,
      requiresReason: skippedStages.length > 0,
      requiresAdmin: false,
    };
  }

  return {
    ok: true,
    direction: "backward",
    skippedStages: [],
    requiresReason: true,
    requiresAdmin: true,
  };
}
