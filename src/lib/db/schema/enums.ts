import { pgEnum } from "drizzle-orm/pg-core";

export const jobTypeEnum = pgEnum("job_type", ["insurance", "retail"]);

export const jobStatusEnum = pgEnum("job_status", [
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
  "lost",
]);

export const jobParticipantRoleEnum = pgEnum("job_participant_role", [
  "sales_owner",
  "knocker",
  "production_manager",
  "office_admin",
]);

export const JOB_STATUSES = jobStatusEnum.enumValues;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  lead: "New Lead",
  inspection_scheduled: "Inspection Scheduled",
  inspected: "Inspected",
  claim_filed: "Claim Filed",
  adjuster_meeting: "Adjuster Meeting",
  approved: "Approved",
  work_order: "Work Order",
  scheduled: "Scheduled",
  installed: "Installed",
  collected: "Collected",
  closed: "Closed",
  lost: "Lost",
};
