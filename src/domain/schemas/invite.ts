import { z } from "zod";

export const createInviteSchema = z.object({
  email: z.string().email(),
  roleName: z.enum(["admin", "sales", "production", "accounting"]).default("sales"),
});

export const registerWithInviteSchema = z
  .object({
    token: z.string().min(16),
    name: z.string().min(1, "Name is required"),
    password: z.string().min(12, "Password must be at least 12 characters"),
    confirmPassword: z.string().min(12),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type RegisterWithInviteInput = z.infer<typeof registerWithInviteSchema>;
