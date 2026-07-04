import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/api-auth";
import { getJobDetail } from "@/domain/queries/get-job-detail";
import { JobDetailsForm } from "@/components/jobs/job-details-form";
import { StatusBadge } from "@/components/jobs/status-badge";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

function PlaceholderSection({ title, note }: { title: string; note: string }) {
  return (
    <section className="rounded-xl border border-dashed border-top-border bg-slate-50 px-4 py-6">
      <h2 className="text-sm font-medium text-top-navy">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </section>
  );
}

export default async function JobDetailPage({ params, searchParams }: JobDetailPageProps) {
  const auth = await requirePagePermission("jobs:read");

  const { id } = await params;
  const { edit } = await searchParams;
  const job = await getJobDetail(id, auth.organizationId);

  if (!job) {
    notFound();
  }

  const isEditing = edit === "1";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/jobs" className="text-sm text-top-muted hover:text-top-navy">
        ← Back to jobs
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-top-muted">Job</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-top-navy">{job.jobNumber}</h1>
            <StatusBadge status={job.status} />
            <span className="text-sm capitalize text-slate-600">{job.jobType}</span>
          </div>
        </div>
        {!isEditing && (
          <Link
            href={`/jobs/${id}?edit=1`}
            className="inline-flex rounded-lg border border-top-border px-4 py-2 text-sm font-medium text-slate-700"
          >
            Edit details
          </Link>
        )}
      </div>

      <div className="mt-8 space-y-6">
        {isEditing ? (
          <section className="rounded-xl border border-top-border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-top-navy">Edit job details</h2>
            <div className="mt-4">
              <JobDetailsForm
                jobId={id}
                initial={{
                  notes: job.notes ?? "",
                  leadSource: job.leadSource ?? "",
                  stormDate: job.stormDate ?? "",
                  jobType: job.jobType,
                }}
              />
            </div>
            <Link href={`/jobs/${id}`} className="mt-4 inline-block text-sm text-top-muted">
              Cancel editing
            </Link>
          </section>
        ) : (
          <section className="rounded-xl border border-top-border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-top-navy">Details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-top-muted">Lead source</dt>
                <dd className="mt-1 text-sm">{job.leadSource ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-top-muted">Storm date</dt>
                <dd className="mt-1 text-sm">{job.stormDate ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-top-muted">Created</dt>
                <dd className="mt-1 text-sm">{new Date(job.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-top-muted">Last updated</dt>
                <dd className="mt-1 text-sm">{new Date(job.updatedAt).toLocaleDateString()}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-top-muted">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm">{job.notes ?? "—"}</dd>
              </div>
            </dl>
          </section>
        )}

        <section className="rounded-xl border border-top-border bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-top-navy">Customer</h2>
          <div className="mt-3 text-sm text-slate-700">
            <Link
              href={`/leads/${job.customer.id}`}
              className="font-medium text-top-navy hover:underline"
            >
              {job.customer.firstName} {job.customer.lastName}
            </Link>
            <p className="mt-1 text-slate-600">{job.customer.phone ?? "—"}</p>
            <p className="text-slate-600">{job.customer.email ?? "—"}</p>
          </div>
        </section>

        <section className="rounded-xl border border-top-border bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-top-navy">Property</h2>
          <p className="mt-3 text-sm text-slate-700">
            {job.property.addressLine1}
            {job.property.addressLine2 ? `, ${job.property.addressLine2}` : ""}
            <br />
            {job.property.city}, {job.property.state} {job.property.zip}
          </p>
        </section>

        <PlaceholderSection
          title="Status pipeline"
          note="Status transitions ship in PR-006. Status is read-only until then."
        />
        <PlaceholderSection
          title="Activity"
          note="Timeline events appear here in PR-007."
        />
      </div>
    </div>
  );
}
