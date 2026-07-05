import { z } from "zod";
import { JOB_STATUSES, type JobStatus } from "@/lib/db/schema/enums";

export const transitionJobSchema = z.object({
  toStatus: z.enum(JOB_STATUSES as unknown as [JobStatus, ...JobStatus[]]),
  reason: z.string().trim().optional(),
});

export type TransitionJobInput = z.infer<typeof transitionJobSchema>;

export const updateJobSchema = z.object({
  notes: z.string().trim().optional(),
  leadSource: z.string().trim().optional(),
  stormDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .nullable()
    .optional(),
  jobType: z.enum(["insurance", "retail"]).optional(),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;
