import { z } from "zod";

export const propertyInputSchema = z.object({
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2).max(2, "Use 2-letter state code"),
  zip: z.string().min(5, "ZIP is required"),
});

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  property: propertyInputSchema,
  leadSource: z.string().optional(),
  jobType: z.enum(["insurance", "retail"]).default("insurance"),
});

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  property: propertyInputSchema.partial().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const transitionJobSchema = z.object({
  toStatus: z.enum([
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
  ]),
  reason: z.string().optional(),
});

export type TransitionJobInput = z.infer<typeof transitionJobSchema>;
