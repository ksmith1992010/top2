import { NextResponse } from "next/server";
import { registerWithInviteCommand } from "@/domain/commands/register-with-invite";
import { registerWithInviteSchema } from "@/domain/schemas/invite";
import { DomainError } from "@/domain/errors";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
      { status: 400 },
    );
  }

  const parsed = registerWithInviteSchema.safeParse(body);
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
    const result = await registerWithInviteCommand(parsed.data);
    return NextResponse.json({ user: result }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) {
      const status =
        error.code === "INVITE_USED" || error.code === "INVITE_EXPIRED"
          ? 409
          : error.code === "INVALID_INVITE"
            ? 400
            : 400;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    throw error;
  }
}
