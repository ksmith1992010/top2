import { z } from "zod";

const DEV_AUTH_SECRET = "development-only-secret-at-least-32-characters";
const DEV_AUTH_URL = "http://localhost:3000";

const serverEnvSchema = z
  .object({
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .refine(
        (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
        "DATABASE_URL must be a PostgreSQL connection string",
      ),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_URL: z.string().url().optional(),
    SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  })
  .transform((env) => {
    const isProduction = env.NODE_ENV === "production";
    const secret = env.BETTER_AUTH_SECRET ?? (isProduction ? undefined : DEV_AUTH_SECRET);
    const url = env.BETTER_AUTH_URL ?? (isProduction ? undefined : DEV_AUTH_URL);

    if (!secret) {
      throw new Error("BETTER_AUTH_SECRET is required in production");
    }
    if (!url) {
      throw new Error("BETTER_AUTH_URL is required in production");
    }

    return {
      ...env,
      BETTER_AUTH_SECRET: secret,
      BETTER_AUTH_URL: url,
    };
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
  });
}
