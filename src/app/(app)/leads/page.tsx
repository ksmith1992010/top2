import { Suspense } from "react";
import { LeadsSearch } from "@/components/leads/leads-search";
import { listCustomers } from "@/domain/queries/customers";
import { requirePagePermission } from "@/lib/auth/page-auth";

type LeadsPageProps = {
  searchParams: Promise<{ search?: string }>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  await requirePagePermission("customers:read");

  const { search } = await searchParams;
  const { items, total } = await listCustomers({ search });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-top-muted">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold text-top-navy">Leads</h1>
        <p className="mt-2 text-sm text-slate-600">
          {total} lead{total === 1 ? "" : "s"}
        </p>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <LeadsSearch initialSearch={search ?? ""} />
      </Suspense>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-top-border bg-white px-6 py-12 text-center">
          <p className="text-base font-medium text-top-navy">No leads yet</p>
          <p className="mt-2 text-sm text-slate-600">
            {search
              ? "Try a different search term."
              : "Leads will appear here once customer records exist."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-top-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-top-border bg-slate-50 text-top-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-top-border last:border-0">
                    <td className="px-4 py-3 font-medium text-top-navy">
                      {item.firstName} {item.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{item.email ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.primaryCity && item.primaryState
                        ? `${item.primaryCity}, ${item.primaryState}`
                        : "—"}
                    </td>
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
