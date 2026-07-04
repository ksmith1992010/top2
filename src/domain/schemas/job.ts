import { z } from "zod";

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
