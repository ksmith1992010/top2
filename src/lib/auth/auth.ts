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
    advanced: {
      database: {
        // users.id is a uuid column, so Better Auth must generate UUID ids (its
        // default short-string ids fail the uuid cast). A function is used rather
        // than the "uuid" mode because "uuid" omits the id and relies on a DB
        // default, which our text session/account/verification ids don't have.
        generateId: () => crypto.randomUUID(),
      },
    },
    user: {
      additionalFields: {
        organizationId: {
          // Populated by the create hook (below) and, for invites, a post-signup
          // update — never supplied as sign-up input. Marking it required here
          // makes Better Auth reject sign-up before the hook can fill it, which
          // breaks both seeding and invite registration. The DB column is NOT NULL.
          type: "string",
          required: false,
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
