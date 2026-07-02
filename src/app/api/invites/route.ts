import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { createInviteCommand } from "@/domain/commands/create-invite";
import { createInviteSchema } from "@/domain/schemas/invite";
import { DomainError } from "@/domain/errors";
import { getServerEnv } from "@/lib/env";

export async function POST(request: Request) {
  const auth = await requireApiPermission("users:create");
  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
      { status: 400 },
    );
  }

  const parsed = createInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message ?? "Invalid input",
        },
      },
      { status: 400 },
    );
  }

  try {
    const { invite, token, expiresAt } = await createInviteCommand({
      data: parsed.data,
      invitedBy: auth.userId,
      organizationId: auth.organizationId,
    });

    const baseUrl = getServerEnv().BETTER_AUTH_URL.replace(/\/$/, "");
    const signupUrl = `${baseUrl}/signup?token=${encodeURIComponent(token)}`;

    return NextResponse.json(
      {
        invite: {
          id: invite.id,
          email: invite.email,
          expiresAt,
        },
        signupUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DomainError) {
      const status = error.code === "INVITE_PENDING" ? 409 : 400;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    throw error;
  }
}
