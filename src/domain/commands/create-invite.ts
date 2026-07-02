import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizations, roles, signupInvites, users } from "@/lib/db/schema";
import type { CreateInviteInput } from "@/domain/schemas/invite";
import { DomainError } from "@/domain/errors";
import { generateInviteToken, hashInviteToken } from "@/lib/invite-tokens";

const INVITE_TTL_DAYS = 7;

export async function createInviteCommand(input: {
  data: CreateInviteInput;
  organizationId: string;
  invitedBy?: string;
}) {
  const { data, invitedBy, organizationId } = input;
  const db = getDb();
  const email = data.email.trim().toLowerCase();

  const [role] = await db.select().from(roles).where(eq(roles.name, data.roleName)).limit(1);
  if (!role) {
    throw new DomainError("INVALID_ROLE", `Role ${data.roleName} not found`);
  }

  const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  if (!org) {
    throw new DomainError("INVALID_ORG", "Organization not found");
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (existingUser) {
    throw new DomainError("EMAIL_EXISTS", "A user with this email already exists");
  }

  // Check pending invites by email alone (not per-org): users.email is
  // globally unique, so a second org's invite could never be accepted anyway.
  const pendingInvites = await db
    .select({ id: signupInvites.id, expiresAt: signupInvites.expiresAt })
    .from(signupInvites)
    .where(and(eq(signupInvites.email, email), isNull(signupInvites.acceptedAt)));

  if (pendingInvites.some((invite) => invite.expiresAt >= new Date())) {
    throw new DomainError("INVITE_PENDING", "A pending invite already exists for this email");
  }

  if (pendingInvites.length > 0) {
    // Only expired, never-accepted invites remain. Remove them so the email
    // can be re-invited — the pending-email unique index can't express
    // expiry, so a stale row would otherwise block the new insert forever.
    await db
      .delete(signupInvites)
      .where(and(eq(signupInvites.email, email), isNull(signupInvites.acceptedAt)));
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  try {
    const [invite] = await db
      .insert(signupInvites)
      .values({
        organizationId,
        email,
        roleId: role.id,
        tokenHash,
        expiresAt,
        ...(invitedBy ? { invitedBy } : {}),
      })
      .returning();

    return { invite, token, expiresAt };
  } catch (error) {
    // Unique violation on idx_signup_invites_pending_email: a concurrent
    // request created the pending invite after our check above.
    if (error instanceof Error && "code" in error && error.code === "23505") {
      throw new DomainError("INVITE_PENDING", "A pending invite already exists for this email");
    }
    throw error;
  }
}
