import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { DomainError } from "@/domain/commands/create-customer";
import { transitionJobCommand } from "@/domain/commands/transition-job";
import { transitionJobSchema } from "@/domain/schemas/customer";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiPermission("jobs:transition");
  if (!auth.ok) {
    return auth.response;
  }

  const { id: jobId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
      { status: 400 },
    );
  }

  const parsed = transitionJobSchema.safeParse(body);
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
    const job = await transitionJobCommand({
      jobId,
      toStatus: parsed.data.toStatus,
      reason: parsed.data.reason,
      actorId: auth.userId,
      organizationId: auth.organizationId,
    });

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof DomainError) {
      const status =
        error.code === "NOT_FOUND" || error.code === "FORBIDDEN"
          ? error.code === "NOT_FOUND"
            ? 404
            : 403
          : 400;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    throw error;
  }
}
