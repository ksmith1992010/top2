import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env";
import { organizations } from "./schema/organizations";
import { rolePermissions, roles } from "./schema/roles";

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
  const connection = postgres(getServerEnv().DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  const existingOrgs = await db.select().from(organizations);
  if (existingOrgs.length === 0) {
    await db.insert(organizations).values({ name: "Over The Top Restoration" });
  }

  for (const role of ROLE_SEED) {
    const [insertedRole] = await db
      .insert(roles)
      .values({ name: role.name, description: role.description })
      .onConflictDoUpdate({
        target: roles.name,
        set: { description: role.description },
      })
      .returning();

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

  await connection.end();
  console.log("Seed complete: organization + roles");
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
