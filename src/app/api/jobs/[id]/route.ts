import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { updateJobCommand } from "@/domain/commands/update-job";
import { DomainError } from "@/domain/errors";
import { getJobDetail } from "@/domain/queries/get-job-detail";
import { updateJobSchema } from "@/domain/schemas/job";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiPermission("jobs:read");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const job = await getJobDetail(id, auth.organizationId);

  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Job not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ job });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiPermission("jobs:update");
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

  const parsed = updateJobSchema.safeParse(body);
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
    const job = await updateJobCommand({
      jobId: id,
      organizationId: auth.organizationId,
      data: parsed.data,
      actorId: auth.userId,
    });

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof DomainError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    throw error;
  }
}
