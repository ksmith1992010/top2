import { LeadForm } from "@/components/leads/lead-form";
import { requirePagePermission } from "@/lib/auth/api-auth";

export default async function NewLeadPage() {
  await requirePagePermission("customers:create");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <p className="text-xs font-medium uppercase tracking-wide text-top-muted">Leads</p>
      <h1 className="mt-1 text-2xl font-semibold text-top-text">New lead</h1>
      <p className="mt-2 text-sm text-top-muted">
        Creates a customer, primary property, and job in one step.
      </p>
      <div className="mt-8 rounded-xl border border-top-border bg-top-card p-6 shadow-sm">
        <LeadForm mode="create" />
      </div>
    </div>
  );
}
