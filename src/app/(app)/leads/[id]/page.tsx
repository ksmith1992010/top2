import Link from "next/link";
import { notFound } from "next/navigation";
import { JobPipeline } from "@/components/leads/job-pipeline";
import { LeadForm } from "@/components/leads/lead-form";
import { getCustomerDetail } from "@/domain/queries/get-customer-detail";
import { JOB_STATUS_LABELS } from "@/lib/db/schema/enums";

type CustomerDetailPageProps = {
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

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const { edit } = await searchParams;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    notFound();
  }

  const isEditing = edit === "1";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/leads" className="text-sm text-top-muted hover:text-top-navy">
        ← Back to leads
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-top-muted">Lead</p>
          <h1 className="mt-1 text-2xl font-semibold text-top-navy">
            {customer.firstName} {customer.lastName}
          </h1>
        </div>
        {!isEditing && (
          <Link
            href={`/leads/${id}?edit=1`}
            className="inline-flex rounded-lg border border-top-border px-4 py-2 text-sm font-medium text-slate-700"
          >
            Edit
          </Link>
        )}
      </div>

      {isEditing ? (
        <div className="mt-8 rounded-xl border border-top-border bg-white p-6 shadow-sm">
          <LeadForm
            mode="edit"
            customerId={id}
            initial={{
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email ?? "",
              phone: customer.phone ?? "",
              notes: customer.notes ?? "",
              addressLine1: customer.primaryProperty?.addressLine1 ?? "",
              addressLine2: customer.primaryProperty?.addressLine2 ?? "",
              city: customer.primaryProperty?.city ?? "",
              state: customer.primaryProperty?.state ?? "",
              zip: customer.primaryProperty?.zip ?? "",
            }}
          />
          <Link href={`/leads/${id}`} className="mt-4 inline-block text-sm text-top-muted">
            Cancel editing
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="rounded-xl border border-top-border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-top-navy">Overview</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-top-muted">Email</dt>
                <dd className="mt-1 text-sm">{customer.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-top-muted">Phone</dt>
                <dd className="mt-1 text-sm">{customer.phone ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-top-muted">Notes</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">{customer.notes ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-top-border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-top-navy">Property</h2>
            {customer.primaryProperty ? (
              <p className="mt-3 text-sm text-slate-700">
                {customer.primaryProperty.addressLine1}
                {customer.primaryProperty.addressLine2
                  ? `, ${customer.primaryProperty.addressLine2}`
                  : ""}
                <br />
                {customer.primaryProperty.city}, {customer.primaryProperty.state}{" "}
                {customer.primaryProperty.zip}
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No property on file.</p>
            )}
          </section>

          <section className="rounded-xl border border-top-border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-top-navy">Job</h2>
            {customer.latestJob ? (
              <div className="mt-4 space-y-4">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-top-muted">Job number</dt>
                    <dd className="mt-1 text-sm font-medium">{customer.latestJob.jobNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-top-muted">Status</dt>
                    <dd className="mt-1 text-sm">
                      {JOB_STATUS_LABELS[customer.latestJob.status]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-top-muted">Type</dt>
                    <dd className="mt-1 text-sm capitalize">{customer.latestJob.jobType}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-top-muted">Lead source</dt>
                    <dd className="mt-1 text-sm">{customer.latestJob.leadSource ?? "—"}</dd>
                  </div>
                </dl>
                <JobPipeline
                  jobId={customer.latestJob.id}
                  currentStatus={customer.latestJob.status}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No job linked yet.</p>
            )}
          </section>

          <PlaceholderSection
            title="Activity"
            note="Timeline events appear here after job transitions and mutations."
          />
          <PlaceholderSection title="Documents" note="Document uploads ship in a later PR." />
          <PlaceholderSection title="Production" note="Production workflows ship in a later PR." />
        </div>
      )}
    </div>
  );
}
