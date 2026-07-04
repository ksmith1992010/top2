import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { listJobs } from "@/domain/queries/list-jobs";

export async function GET(request: Request) {
  const auth = await requireApiPermission("jobs:read");
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const limit = searchParams.get("limit")
    ? Number.parseInt(searchParams.get("limit")!, 10)
    : undefined;
  const offset = searchParams.get("offset")
    ? Number.parseInt(searchParams.get("offset")!, 10)
    : undefined;

  const result = await listJobs({
    organizationId: auth.organizationId,
    search,
    status,
    limit,
    offset,
  });

  return NextResponse.json(result);
}
