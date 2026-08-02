import Link from "next/link";
import { Suspense } from "react";
import { JobsFilters } from "@/components/jobs/jobs-filters";
import { listJobs } from "@/domain/queries/list-jobs";
import { requirePagePermission } from "@/lib/auth/api-auth";
import { JOB_STATUS_LABELS, JOB_STATUSES, type JobStatus } from "@/lib/db/schema/enums";

type JobsPageProps = {
  searchParams: Promise<{ search?: string; status?: string }>;
};

function resolveStatus(status: string | undefined): JobStatus | undefined {
  if (!status) {
    return undefined;
  }
  return (JOB_STATUSES as readonly string[]).includes(status)
    ? (status as JobStatus)
    : undefined;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const auth = await requirePagePermission("jobs:read");
  const { search, status: statusParam } = await searchParams;
  const status = resolveStatus(statusParam);

  const { items, total } = await listJobs({
    organizationId: auth.organizationId,
    search,
    status,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-top-gold">Operations</p>
        <h1 className="mt-1 text-2xl font-semibold text-top-text">Jobs</h1>
        <p className="mt-2 text-sm text-top-muted">
          {total} job{total === 1 ? "" : "s"} · run every roof from lead to paid
        </p>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <JobsFilters
          key={`${search ?? ""}:${statusParam ?? ""}`}
          initialSearch={search ?? ""}
          initialStatus={status ?? ""}
        />
      </Suspense>

      {items.length === 0 ? (
        <div className="command-card mt-8 px-6 py-12 text-center">
          <p className="text-base font-medium text-top-text">No jobs yet</p>
          <p className="mt-2 text-sm text-top-muted">
            {search || status
              ? "Try a different search or status filter."
              : "Create a lead first, then RoofRun will track the roof from lead to paid."}
          </p>
          <Link
            href="/leads/new"
            className="mt-6 inline-flex rounded-lg bg-top-gold px-4 py-2 text-sm font-semibold text-top-navy"
          >
            New lead
          </Link>
        </div>
      ) : (
        <div className="command-card mt-6 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-top-border text-top-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Job #</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Rep</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-top-border last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/jobs/${item.id}`}
                        className="font-medium text-top-gold hover:underline"
                      >
                        {item.jobNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-top-text">
                      <Link href={`/leads/${item.customerId}`} className="hover:underline">
                        {item.customerName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-top-muted">
                      {item.addressLine1}
                      <br />
                      {item.city}, {item.state} {item.zip}
                    </td>
                    <td className="px-4 py-3 text-top-text">
                      {JOB_STATUS_LABELS[item.status]}
                    </td>
                    <td className="px-4 py-3 capitalize text-top-muted">{item.jobType}</td>
                    <td className="px-4 py-3 text-top-muted">{item.salesOwnerName ?? "—"}</td>
                    <td className="px-4 py-3 text-top-muted">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
