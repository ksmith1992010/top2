import { NextResponse } from "next/server";
import { validateInviteToken } from "@/domain/commands/register-with-invite";
import { DomainError } from "@/domain/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Token is required" } },
      { status: 400 },
    );
  }

  try {
    const invite = await validateInviteToken(token);
    return NextResponse.json({
      email: invite.email,
      organizationName: invite.organizationName,
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 400 });
    }
    throw error;
  }
}
