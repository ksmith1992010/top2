import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { getJobDetail } from "@/domain/queries/get-job-detail";
import { listJobActivity } from "@/domain/queries/list-activity";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiPermission("jobs:read");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;

  // Org-scope check: only return a timeline for a job in the caller's org.
  const job = await getJobDetail(id, auth.organizationId);
  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Job not found" } },
      { status: 404 },
    );
  }

  const events = await listJobActivity(id);
  return NextResponse.json({ events });
}
