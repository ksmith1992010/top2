import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getAuth } from "@/lib/auth/auth";
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
import { rolePermissions, roles, userRoles, users } from "./schema";

type PostgresDb = ReturnType<typeof drizzle>;

/**
 * Idempotently create an admin user through Better Auth (hashed password),
 * mark it verified, and grant the admin role. Skips if the email already exists.
 */
async function seedAdminUser(
  db: PostgresDb,
  adminRoleId: string,
  account: { email: string; name: string; password: string },
): Promise<"created" | "exists"> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, account.email))
    .limit(1);

  if (existing.length > 0) {
    return "exists";
  }

  const signUp = await getAuth().api.signUpEmail({
    body: { email: account.email, password: account.password, name: account.name },
  });

  if (!signUp?.user) {
    throw new Error(`Failed to seed admin user ${account.email} via Better Auth`);
  }

  await db.update(users).set({ emailVerified: true }).where(eq(users.id, signUp.user.id));
  await db.insert(userRoles).values({ userId: signUp.user.id, roleId: adminRoleId });

  return "created";
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

  // Real owner admin — created in any environment when an explicit password is set.
  const ownerPassword = resolveOwnerAdminPassword(env);
  if (ownerPassword) {
    const result = await seedAdminUser(db, adminRoleId, {
      email: OWNER_ADMIN_EMAIL,
      name: OWNER_ADMIN_NAME,
      password: ownerPassword,
    });
    console.log(`Owner admin ${OWNER_ADMIN_EMAIL}: ${result}`);
  } else {
    console.log("Owner admin skipped (set SEED_ADMIN_PASSWORD to provision it)");
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

  await connection.end();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
