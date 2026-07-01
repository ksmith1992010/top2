import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getAuth } from "@/lib/auth/auth";
import { getServerEnv } from "@/lib/env";
import {
  DEV_ADMIN_EMAIL,
  DEV_ADMIN_NAME,
  isDevAdminSeedAllowed,
  resolveDevAdminPassword,
} from "./seed-dev-admin";
import { organizations } from "./schema/organizations";
import { rolePermissions, roles, userRoles, users } from "./schema";

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

  if (!isDevAdminSeedAllowed(env)) {
    console.log("Seed complete: organization + roles (dev admin skipped in production)");
    await connection.end();
    return;
  }

  const adminPassword = resolveDevAdminPassword(env);
  const existingAdmin = await db.select().from(users).where(eq(users.email, DEV_ADMIN_EMAIL)).limit(1);

  if (existingAdmin.length === 0) {
    const signUp = await getAuth().api.signUpEmail({
      body: {
        email: DEV_ADMIN_EMAIL,
        password: adminPassword,
        name: DEV_ADMIN_NAME,
      },
    });

    if (!signUp?.user) {
      throw new Error("Failed to seed dev admin user via Better Auth");
    }

    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, signUp.user.id));

    const adminRoleId = roleIds.get("admin");
    if (!adminRoleId) {
      throw new Error("Admin role missing after seed");
    }

    await db.insert(userRoles).values({
      userId: signUp.user.id,
      roleId: adminRoleId,
    });

    console.log(`Seed complete: dev admin ${DEV_ADMIN_EMAIL} (password in docs / SEED_ADMIN_PASSWORD override)`);
  } else {
    console.log("Seed complete: organization + roles (dev admin already exists)");
  }

  await connection.end();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
