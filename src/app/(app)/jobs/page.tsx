import Link from "next/link";
import { Suspense } from "react";
import { requirePagePermission } from "@/lib/auth/api-auth";
import { listJobs } from "@/domain/queries/list-jobs";
import { JobsFilter } from "@/components/jobs/jobs-filter";
import { StatusBadge } from "@/components/jobs/status-badge";

type JobsPageProps = {
  searchParams: Promise<{ search?: string; status?: string }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const auth = await requirePagePermission("jobs:read");

  const { search, status } = await searchParams;
  const { items, total } = await listJobs({
    organizationId: auth.organizationId,
    search,
    status,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-top-muted">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold text-top-navy">Jobs</h1>
        <p className="mt-2 text-sm text-slate-600">
          {total} job{total === 1 ? "" : "s"} — created from lead intake; statuses advance via the
          pipeline (coming in PR-006)
        </p>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <JobsFilter
          key={`${search ?? ""}|${status ?? ""}`}
          initialSearch={search ?? ""}
          initialStatus={status ?? ""}
        />
      </Suspense>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-top-border bg-white px-6 py-12 text-center">
          <p className="text-base font-medium text-top-navy">No jobs found</p>
          <p className="mt-2 text-sm text-slate-600">
            {search || status
              ? "Try a different search or status filter."
              : "Jobs are created automatically when you add a lead."}
          </p>
          <Link
            href="/leads/new"
            className="mt-6 inline-flex rounded-lg bg-top-navy px-4 py-2 text-sm font-medium text-white"
          >
            New lead
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-top-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-top-border bg-slate-50 text-top-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Job #</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-top-border last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/jobs/${item.id}`}
                        className="font-medium text-top-navy hover:underline"
                      >
                        {item.jobNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.customerFirstName} {item.customerLastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.city}, {item.state}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{item.jobType}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(item.createdAt).toLocaleDateString()}
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
