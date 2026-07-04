import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getAuth } from "@/lib/auth/auth";
import { closeDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import {
  DEV_ADMIN_EMAIL,
  DEV_ADMIN_NAME,
  isDevAdminSeedAllowed,
  OWNER_ADMIN_EMAIL,
  OWNER_ADMIN_NAME,
  resolveDevAdminPassword,
  resolveOwnerAdminPassword,
} from "./seed-dev-admin";
import { organizations } from "./schema/organizations";
import { activityEvents, rolePermissions, roles, userRoles, users } from "./schema";

type PostgresDb = ReturnType<typeof drizzle>;

/**
 * Idempotently provision an admin user. Creates the account through Better
 * Auth (hashed password) when missing; on every run ensures the account is
 * verified and holds the admin role, so a previously interrupted run is
 * repaired. Does not rotate the password of an existing account.
 */
async function seedAdminUser(
  db: PostgresDb,
  adminRoleId: string,
  account: { email: string; name: string; password: string },
): Promise<"created" | "exists"> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, account.email))
    .limit(1);

  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    const signUp = await getAuth().api.signUpEmail({
      body: { email: account.email, password: account.password, name: account.name },
    });

    if (!signUp?.user) {
      throw new Error(`Failed to seed admin user ${account.email} via Better Auth`);
    }
    userId = signUp.user.id;
  }

  try {
    await db.transaction(async (tx) => {
      await tx.update(users).set({ emailVerified: true }).where(eq(users.id, userId));
      await tx
        .insert(userRoles)
        .values({ userId, roleId: adminRoleId })
        .onConflictDoNothing();

      if (!existing) {
        await tx.insert(activityEvents).values({
          actorId: userId,
          eventType: "user.seeded",
          subjectType: "user",
          subjectId: userId,
          payload: { email: account.email, role: "admin" },
        });
      }
    });
  } catch (error) {
    if (!existing) {
      // signUpEmail can't join our transaction; remove the half-created auth
      // user so a re-run starts clean instead of skipping it as "exists".
      try {
        await db.delete(users).where(eq(users.id, userId));
      } catch (cleanupError) {
        console.error(
          `seed: failed to clean up half-created admin ${account.email} (${userId})`,
          cleanupError,
        );
      }
    }
    throw error;
  }

  return existing ? "exists" : "created";
}

const ROLE_SEED = [
  {
    name: "admin",
    description: "Full system access",
    permissions: ["*"],
  },
  {
    name: "sales",
    description: "Sales and lead management",
    permissions: ["customers:*", "jobs:*", "appointments:*", "job_events:*"],
  },
  {
    name: "production",
    description: "Production scheduling and field ops",
    permissions: [
      "jobs:read",
      "jobs:transition:production",
      "production:*",
      "appointments:*",
    ],
  },
  {
    name: "accounting",
    description: "Invoices and payments",
    permissions: ["jobs:read", "invoices:*", "payments:*"],
  },
] as const;

async function seed() {
  const env = getServerEnv();
  const connection = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  try {
    const existingOrgs = await db.select().from(organizations).limit(1);
    let organization = existingOrgs[0];

    if (!organization) {
      [organization] = await db
        .insert(organizations)
        .values({ name: "Over The Top Restoration" })
        .returning();
    }

    if (!organization) {
      throw new Error("Failed to seed organization");
    }

    const roleIds = new Map<string, string>();

    for (const role of ROLE_SEED) {
      const [insertedRole] = await db
        .insert(roles)
        .values({ name: role.name, description: role.description })
        .onConflictDoUpdate({
          target: roles.name,
          set: { description: role.description },
        })
        .returning();

      roleIds.set(role.name, insertedRole.id);

      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, insertedRole.id));

      if (role.permissions.length > 0) {
        await db.insert(rolePermissions).values(
          role.permissions.map((permission) => ({
            roleId: insertedRole.id,
            permission,
          })),
        );
      }
    }

    const adminRoleId = roleIds.get("admin");
    if (!adminRoleId) {
      throw new Error("Admin role missing after seed");
    }

    // Real owner admin — provisioned in any environment, but only via its
    // dedicated env var so it can never share the demo admin's password.
    const ownerPassword = resolveOwnerAdminPassword();
    if (ownerPassword) {
      const result = await seedAdminUser(db, adminRoleId, {
        email: OWNER_ADMIN_EMAIL,
        name: OWNER_ADMIN_NAME,
        password: ownerPassword,
      });
      console.log(`Owner admin ${OWNER_ADMIN_EMAIL}: ${result}`);
    } else {
      console.log("Owner admin skipped (set SEED_OWNER_ADMIN_PASSWORD to provision it)");
    }

    // Demo/preview admin — gated to non-production (or Vercel preview / SEED_DEV_ADMIN).
    if (isDevAdminSeedAllowed(env)) {
      const result = await seedAdminUser(db, adminRoleId, {
        email: DEV_ADMIN_EMAIL,
        name: DEV_ADMIN_NAME,
        password: resolveDevAdminPassword(env),
      });
      console.log(`Dev admin ${DEV_ADMIN_EMAIL}: ${result}`);
    } else {
      console.log("Dev admin skipped in production");
    }
  } finally {
    // Close both clients: the seed's own connection and the getDb() singleton
    // that Better Auth uses — otherwise the process never exits.
    await connection.end();
    await closeDb();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
