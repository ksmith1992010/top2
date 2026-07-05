import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { getUserPermissions } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/permissions";
import { transitionJobCommand } from "@/domain/commands/transition-job";
import { DomainError } from "@/domain/errors";
import { transitionJobSchema } from "@/domain/schemas/job";

type RouteContext = { params: Promise<{ id: string }> };

const ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  ADMIN_REQUIRED: 403,
  INVALID_TRANSITION: 400,
  REASON_REQUIRED: 400,
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiPermission("jobs:transition");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;

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

  const permissions = await getUserPermissions(auth.userId);
  const canGoBackward = hasPermission(permissions, "jobs:transition:admin");

  try {
    const job = await transitionJobCommand({
      jobId: id,
      organizationId: auth.organizationId,
      toStatus: parsed.data.toStatus,
      reason: parsed.data.reason,
      actorId: auth.userId,
      canGoBackward,
    });

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: ERROR_STATUS[error.code] ?? 400 },
      );
    }
    throw error;
  }
}
