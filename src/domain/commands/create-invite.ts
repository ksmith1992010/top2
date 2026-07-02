import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizations, roles, signupInvites } from "@/lib/db/schema";
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

  const [pending] = await db
    .select({ id: signupInvites.id })
    .from(signupInvites)
    .where(
      and(
        eq(signupInvites.organizationId, organizationId),
        eq(signupInvites.email, email),
        isNull(signupInvites.acceptedAt),
      ),
    )
    .limit(1);

  if (pending) {
    throw new DomainError("INVITE_PENDING", "A pending invite already exists for this email");
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

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
}
