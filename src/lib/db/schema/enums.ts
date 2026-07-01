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
