import { pgEnum } from "drizzle-orm/pg-core";

export const jobTypeEnum = pgEnum("job_type", ["insurance", "retail"]);

export const jobStatusEnum = pgEnum("job_status", [
  "lead",
  "inspection_scheduled",
  "inspection_complete",
  "claim_filed",
  "adjuster_meeting_scheduled",
  "approved",
  "contract_signed",
  "material_ordered",
  "production_scheduled",
  "installed",
  "invoiced",
  "paid",
  "closed",
]);

export const jobParticipantRoleEnum = pgEnum("job_participant_role", [
  "sales_owner",
  "knocker",
  "production_manager",
  "office_admin",
]);

export const JOB_STATUSES = jobStatusEnum.enumValues;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Human-readable labels for each job status. Display only — not stored. */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  lead: "New Lead",
  inspection_scheduled: "Inspection Scheduled",
  inspection_complete: "Inspection Complete",
  claim_filed: "Claim Filed",
  adjuster_meeting_scheduled: "Adjuster Meeting Scheduled",
  approved: "Approved",
  contract_signed: "Contract Signed",
  material_ordered: "Material Ordered",
  production_scheduled: "Production Scheduled",
  installed: "Installed",
  invoiced: "Invoiced",
  paid: "Paid",
  closed: "Closed",
};
