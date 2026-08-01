import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getAuth } from "@/lib/auth/auth";
import type { ServerEnv } from "@/lib/env";
import {
  DEV_ADMIN_EMAIL,
  DEV_ADMIN_NAME,
  isDevAdminSeedAllowed,
  resolveDevAdminPassword,
} from "./seed-dev-admin";
import {
  account,
  organizations,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "./schema";

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

export type SeedResult =
  | { ok: true; admin: "skipped" | "created" | "password_reset" | "unchanged"; email?: string }
  | { ok: false; code: string; message: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SeedDb = PostgresJsDatabase<any>;

export async function runSeed(db: SeedDb, env: ServerEnv): Promise<SeedResult> {
  const existingOrgs = await db.select().from(organizations).limit(1);
  let organization = existingOrgs[0];

  if (!organization) {
    [organization] = await db
      .insert(organizations)
      .values({ name: "Over The Top Restoration" })
      .returning();
  }

  if (!organization) {
    return { ok: false, code: "SEED_FAILED", message: "Failed to seed organization" };
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
    return { ok: true, admin: "skipped" };
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
      return { ok: false, code: "SEED_FAILED", message: "Failed to seed dev admin user via Better Auth" };
    }

    await db.update(users).set({ emailVerified: true }).where(eq(users.id, signUp.user.id));

    const adminRoleId = roleIds.get("admin");
    if (!adminRoleId) {
      return { ok: false, code: "SEED_FAILED", message: "Admin role missing after seed" };
    }

    await db.insert(userRoles).values({
      userId: signUp.user.id,
      roleId: adminRoleId,
    });

    return { ok: true, admin: "created", email: DEV_ADMIN_EMAIL };
  }

  if (env.SEED_ADMIN_PASSWORD) {
    const adminUser = existingAdmin[0];
    const hashed = await hashPassword(adminPassword);
    const updated = await db
      .update(account)
      .set({ password: hashed, updatedAt: new Date() })
      .where(and(eq(account.userId, adminUser.id), eq(account.providerId, "credential")))
      .returning({ id: account.id });

    if (updated.length === 0) {
      return {
        ok: false,
        code: "SEED_FAILED",
        message: "Admin user exists but credential account password could not be updated",
      };
    }

    return { ok: true, admin: "password_reset", email: DEV_ADMIN_EMAIL };
  }

  return { ok: true, admin: "unchanged", email: DEV_ADMIN_EMAIL };
}
