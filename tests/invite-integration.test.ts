import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "@/lib/db";
import { organizations, roles, signupInvites } from "@/lib/db/schema";
import { createInviteCommand } from "@/domain/commands/create-invite";
import { validateInviteToken } from "@/domain/commands/register-with-invite";
import { hashInviteToken } from "@/lib/invite-tokens";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("invite registration integration", () => {
  it("creates and validates an invite", async () => {
    const db = getDb();

    const [org] = await db
      .insert(organizations)
      .values({ name: `Invite Test Org ${Date.now()}` })
      .returning();

    let createdRoleId: string | null = null;
    const [existingRole] = await db.select().from(roles).where(eq(roles.name, "sales")).limit(1);
    if (!existingRole) {
      const [created] = await db.insert(roles).values({ name: "sales" }).returning();
      createdRoleId = created.id;
    }

    const email = `invite-${Date.now()}@example.com`;
    const { token, invite } = await createInviteCommand({
      data: { email, roleName: "sales" },
      organizationId: org.id,
    });

    expect(invite.email).toBe(email);

    const validated = await validateInviteToken(token);
    expect(validated.email).toBe(email);
    expect(validated.organizationName).toBe(org.name);

    await db.delete(signupInvites).where(eq(signupInvites.id, invite.id));
    if (createdRoleId) {
      await db.delete(roles).where(eq(roles.id, createdRoleId));
    }
    await db.delete(organizations).where(eq(organizations.id, org.id));

    await closeDb();
  });

  it("rejects unknown token hash", async () => {
    await expect(validateInviteToken("not-a-real-token-value-here")).rejects.toMatchObject({
      code: "INVALID_INVITE",
    });
  });
});

describe("hashInviteToken", () => {
  it("produces hex digest", () => {
    expect(hashInviteToken("abc")).toMatch(/^[a-f0-9]{64}$/);
  });
});
