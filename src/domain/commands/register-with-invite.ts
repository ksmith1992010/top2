import { and, eq, isNull } from "drizzle-orm";
import { getAuth } from "@/lib/auth/auth";
import { getDb } from "@/lib/db";
import {
  organizations,
  signupInvites,
  userRoles,
  users,
} from "@/lib/db/schema";
import type { RegisterWithInviteInput } from "@/domain/schemas/invite";
import { DomainError } from "@/domain/errors";
import { hashInviteToken } from "@/lib/invite-tokens";

export async function validateInviteToken(token: string) {
  const db = getDb();
  const tokenHash = hashInviteToken(token);

  const [invite] = await db
    .select({
      id: signupInvites.id,
      email: signupInvites.email,
      expiresAt: signupInvites.expiresAt,
      acceptedAt: signupInvites.acceptedAt,
      organizationId: signupInvites.organizationId,
      roleId: signupInvites.roleId,
      organizationName: organizations.name,
    })
    .from(signupInvites)
    .innerJoin(organizations, eq(signupInvites.organizationId, organizations.id))
    .where(eq(signupInvites.tokenHash, tokenHash))
    .limit(1);

  if (!invite) {
    throw new DomainError("INVALID_INVITE", "Invite link is invalid");
  }

  if (invite.acceptedAt) {
    throw new DomainError("INVITE_USED", "Invite has already been used");
  }

  if (invite.expiresAt < new Date()) {
    throw new DomainError("INVITE_EXPIRED", "Invite has expired");
  }

  return invite;
}

export async function registerWithInviteCommand(input: RegisterWithInviteInput) {
  const invite = await validateInviteToken(input.token);
  const db = getDb();

  const signUp = await getAuth().api.signUpEmail({
    body: {
      email: invite.email,
      password: input.password,
      name: input.name.trim(),
    },
  });

  if (!signUp?.user) {
    throw new DomainError("SIGNUP_FAILED", "Could not create account — email may already be registered");
  }

  const userId = signUp.user.id;

  try {
    await db.transaction(async (tx) => {
      const [accepted] = await tx
        .select({ id: signupInvites.id })
        .from(signupInvites)
        .where(
          and(eq(signupInvites.id, invite.id), isNull(signupInvites.acceptedAt)),
        )
        .limit(1);

      if (!accepted) {
        throw new DomainError("INVITE_USED", "Invite has already been used");
      }

      await tx
        .update(users)
        .set({
          organizationId: invite.organizationId,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      await tx.insert(userRoles).values({
        userId,
        roleId: invite.roleId,
      });

      await tx
        .update(signupInvites)
        .set({ acceptedAt: new Date() })
        .where(eq(signupInvites.id, invite.id));
    });
  } catch (error) {
    if (error instanceof DomainError) {
      throw error;
    }
    throw new DomainError(
      "REGISTRATION_INCOMPLETE",
      "Account was created but setup failed. Contact an administrator.",
    );
  }

  return { userId, email: invite.email };
}
