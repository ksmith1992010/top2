import { JOB_STATUSES, type JobStatus } from "@/lib/db/schema/enums";

/**
 * The company's field pipeline. Reps think in these nine stages, not in the
 * thirteen canonical `job_status` values the database stores.
 *
 * This module is display-only: nothing here is persisted, and the enum is
 * untouched. `$` is keyed `money` because a bare `$` is not an identifier.
 */
export const PIPELINE_STAGES = [
  "lead",
  "ci",
  "adj_mt",
  "dr",
  "ctr",
  "mo",
  "wo",
  "money",
  "closed",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** Expanded names, for column headers and detail views where a new rep needs the words. */
export const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: "Lead",
  ci: "CI — Claim/Inspection Started",
  adj_mt: "ADJ MT — Adjuster Meeting",
  dr: "DR — Damage Report",
  ctr: "CTR — Contract Signed",
  mo: "MO — Material Order",
  wo: "WO — Work Order",
  money: "$ — Money / Collections",
  closed: "Closed",
};

/** Bare abbreviations, for tight spots — rep cards, card chips, filter pills. */
export const STAGE_SHORT_LABELS: Record<PipelineStage, string> = {
  lead: "Lead",
  ci: "CI",
  adj_mt: "ADJ MT",
  dr: "DR",
  ctr: "CTR",
  mo: "MO",
  wo: "WO",
  money: "$",
  closed: "Closed",
};

/**
 * Canonical status to field stage. Typed as a total record over `JobStatus`, so
 * adding a value to the `job_status` enum fails the build here rather than
 * silently dropping those jobs off the board.
 */
export const STATUS_TO_STAGE: Record<JobStatus, PipelineStage> = {
  lead: "lead",
  inspection_scheduled: "ci",
  inspection_complete: "ci",
  claim_filed: "adj_mt",
  adjuster_meeting_scheduled: "adj_mt",
  approved: "dr",
  contract_signed: "ctr",
  material_ordered: "mo",
  production_scheduled: "wo",
  installed: "wo",
  invoiced: "money",
  paid: "money",
  closed: "closed",
};

/**
 * The single status a job lands on when it *enters* a stage.
 *
 * The stage mapping is many-to-one, so it does not invert on its own. Nothing
 * writes a status in PR-010a; this exists so PR-014's transition rules and any
 * future drag/drop have one obvious target instead of each caller picking its
 * own. Within-stage progression (`claim_filed` → `adjuster_meeting_scheduled`)
 * is a normal status change and does not move the card.
 */
export const STAGE_ENTRY_STATUS: Record<PipelineStage, JobStatus> = {
  lead: "lead",
  ci: "inspection_scheduled",
  adj_mt: "claim_filed",
  dr: "approved",
  ctr: "contract_signed",
  mo: "material_ordered",
  wo: "production_scheduled",
  money: "invoiced",
  closed: "closed",
};

/**
 * Statuses belonging to each stage, in canonical enum order. Derived from
 * `STATUS_TO_STAGE` rather than hand-written — maintaining both directions by
 * hand is how the two drift apart.
 */
export const STAGE_STATUSES: Record<PipelineStage, JobStatus[]> = (() => {
  const grouped = Object.fromEntries(
    PIPELINE_STAGES.map((stage) => [stage, [] as JobStatus[]]),
  ) as Record<PipelineStage, JobStatus[]>;

  for (const status of JOB_STATUSES) {
    grouped[STATUS_TO_STAGE[status]].push(status);
  }

  return grouped;
})();

export function stageForStatus(status: JobStatus): PipelineStage {
  return STATUS_TO_STAGE[status];
}
