import { NextResponse } from "next/server";
import { updateJobStatusCommand } from "@/domain/commands/update-job-status";
import { DomainError } from "@/domain/errors";
import { updateJobStatusSchema } from "@/domain/schemas/job";
import { requireApiPermission } from "@/lib/auth/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
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

  const parsed = updateJobStatusSchema.safeParse(body);
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
    const result = await updateJobStatusCommand({
      jobId: id,
      organizationId: auth.organizationId,
      actorId: auth.userId,
      data: parsed.data,
    });

    return NextResponse.json({
      job: {
        id: result.id,
        status: result.status,
        updatedAt: result.updatedAt,
      },
      changed: result.changed,
    });
  } catch (error) {
    if (error instanceof DomainError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status },
      );
    }
    throw error;
  }
}
