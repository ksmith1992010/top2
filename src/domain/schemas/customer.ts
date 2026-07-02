import { z } from "zod";

export const propertyInputSchema = z.object({
  addressLine1: z.string().trim().min(1, "Address is required"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(2).max(2, "Use 2-letter state code"),
  zip: z.string().trim().min(5, "ZIP is required"),
});

export const createCustomerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  property: propertyInputSchema,
  leadSource: z.string().trim().optional(),
  jobType: z.enum(["insurance", "retail"]).default("insurance"),
});

export const updateCustomerSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  property: propertyInputSchema.partial().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
