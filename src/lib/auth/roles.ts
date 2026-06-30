import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rolePermissions, roles, userRoles } from "@/lib/db/schema";

export type UserRoleSummary = {
  name: string;
  permissions: string[];
};

export async function getUserRolesAndPermissions(userId: string): Promise<UserRoleSummary[]> {
  const db = getDb();

  const rows = await db
    .select({
      roleName: roles.name,
      permission: rolePermissions.permission,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const byRole = new Map<string, Set<string>>();

  for (const row of rows) {
    const permissions = byRole.get(row.roleName) ?? new Set<string>();
    if (row.permission) {
      permissions.add(row.permission);
    }
    byRole.set(row.roleName, permissions);
  }

  return [...byRole.entries()].map(([name, permissions]) => ({
    name,
    permissions: [...permissions],
  }));
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const rolesWithPermissions = await getUserRolesAndPermissions(userId);
  return [...new Set(rolesWithPermissions.flatMap((role) => role.permissions))];
}
