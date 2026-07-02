import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/lib/db";
import { organizations } from "@/lib/db/schema/organizations";
import * as schema from "@/lib/db/schema";
import { getServerEnv } from "@/lib/env";

function createAuth() {
  const env = getServerEnv();

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        organizationId: {
          type: "string",
          required: true,
          input: false,
        },
        phone: {
          type: "string",
          required: false,
          input: false,
        },
        isActive: {
          type: "boolean",
          required: true,
          defaultValue: true,
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const existingOrgId = (user as { organizationId?: string }).organizationId;
            if (existingOrgId) {
              return { data: user };
            }

            const db = getDb();
            const [organization] = await db.select().from(organizations).limit(1);
            if (!organization) {
              throw new Error(
                "Cannot create a user before an organization exists. Use invite registration or seed first.",
              );
            }

            return {
              data: {
                ...user,
                organizationId: organization.id,
              },
            };
          },
        },
      },
    },
    plugins: [nextCookies()],
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}

export type Session = AuthInstance["$Infer"]["Session"];
