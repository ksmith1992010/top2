import { z } from "zod";
import { JOB_STATUSES } from "@/lib/db/schema/enums";

export const updateJobStatusSchema = z.object({
  status: z.enum(JOB_STATUSES, {
    errorMap: () => ({ message: "Invalid job status" }),
  }),
});

export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
