import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobDetail } from "@/domain/queries/get-job-detail";
import { requirePagePermission } from "@/lib/auth/api-auth";
import { JOB_STATUS_LABELS } from "@/lib/db/schema/enums";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

function PlaceholderSection({ title, note }: { title: string; note: string }) {
  return (
    <section className="rounded-xl border border-dashed border-top-border bg-top-surface-raised/40 px-4 py-6">
      <h2 className="text-sm font-medium text-top-text">{title}</h2>
      <p className="mt-2 text-sm text-top-muted">{note}</p>
    </section>
  );
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const auth = await requirePagePermission("jobs:read");
  const { id } = await params;
  const job = await getJobDetail({ jobId: id, organizationId: auth.organizationId });

  if (!job) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/jobs" className="text-sm text-top-muted hover:text-top-gold">
        ← Back to jobs
      </Link>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-top-gold">Job</p>
        <h1 className="mt-1 text-2xl font-semibold text-top-text">{job.jobNumber}</h1>
        <p className="mt-2 text-sm text-top-muted">
          {JOB_STATUS_LABELS[job.status]} ·{" "}
          <span className="capitalize">{job.jobType}</span>
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <section className="command-card">
          <h2 className="text-sm font-medium text-top-text">Overview</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-top-muted">Status</dt>
              <dd className="mt-1 text-sm text-top-text">{JOB_STATUS_LABELS[job.status]}</dd>
            </div>
            <div>
              <dt className="text-xs text-top-muted">Type</dt>
              <dd className="mt-1 text-sm capitalize text-top-text">{job.jobType}</dd>
            </div>
            <div>
              <dt className="text-xs text-top-muted">Lead source</dt>
              <dd className="mt-1 text-sm text-top-text">{job.leadSource ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-top-muted">Date of loss</dt>
              <dd className="mt-1 text-sm text-top-text">{job.stormDate ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-top-muted">Sales rep</dt>
              <dd className="mt-1 text-sm text-top-text">{job.salesOwnerName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-top-muted">Created</dt>
              <dd className="mt-1 text-sm text-top-text">
                {new Date(job.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-top-muted">Updated</dt>
              <dd className="mt-1 text-sm text-top-text">
                {new Date(job.updatedAt).toLocaleString()}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-top-muted">Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-top-text">
                {job.notes ?? "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="command-card">
          <h2 className="text-sm font-medium text-top-text">Customer</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-top-muted">Name</dt>
              <dd className="mt-1 text-sm text-top-text">
                <Link href={`/leads/${job.customer.id}`} className="text-top-gold hover:underline">
                  {job.customer.firstName} {job.customer.lastName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-top-muted">Phone</dt>
              <dd className="mt-1 text-sm text-top-text">{job.customer.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-top-muted">Email</dt>
              <dd className="mt-1 text-sm text-top-text">{job.customer.email ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="command-card">
          <h2 className="text-sm font-medium text-top-text">Property</h2>
          <p className="mt-3 text-sm text-top-text">
            {job.property.addressLine1}
            {job.property.addressLine2 ? `, ${job.property.addressLine2}` : ""}
            <br />
            {job.property.city}, {job.property.state} {job.property.zip}
          </p>
        </section>

        <PlaceholderSection
          title="Pipeline"
          note="Pipeline controls are coming in a later PR."
        />
        <PlaceholderSection
          title="Activity"
          note="Timeline events show here once job updates are logged."
        />
        <PlaceholderSection
          title="Documents & photos"
          note="Documents and photos are not wired yet."
        />
        <PlaceholderSection
          title="Estimate"
          note="Estimate workflows are planned later."
        />
        <PlaceholderSection
          title="Materials & production"
          note="Materials and production tracking are planned next."
        />
        <PlaceholderSection
          title="Payments"
          note="Invoices and payments are not wired yet."
        />
      </div>
    </div>
  );
}
