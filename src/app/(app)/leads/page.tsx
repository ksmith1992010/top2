import Link from "next/link";
import { Suspense } from "react";
import { requirePagePermission } from "@/lib/auth/api-auth";
import { listCustomers } from "@/domain/queries/list-customers";
import { LeadsSearch } from "@/components/leads/leads-search";

type LeadsPageProps = {
  searchParams: Promise<{ search?: string }>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  await requirePagePermission("customers:read");

  const { search } = await searchParams;
  const { items, total } = await listCustomers({ search });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-top-muted">CRM</p>
          <h1 className="mt-1 text-2xl font-semibold text-top-text">Leads</h1>
          <p className="mt-2 text-sm text-top-muted">{total} lead{total === 1 ? "" : "s"}</p>
        </div>
        <Link
          href="/leads/new"
          className="inline-flex items-center justify-center rounded-lg bg-top-accent px-4 py-2 text-sm font-medium text-top-on-accent"
        >
          New lead
        </Link>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <LeadsSearch key={search ?? ""} initialSearch={search ?? ""} />
      </Suspense>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-top-border bg-top-card px-6 py-12 text-center">
          <p className="text-base font-medium text-top-text">No leads yet</p>
          <p className="mt-2 text-sm text-top-muted">
            {search ? "Try a different search or create a new lead." : "Create your first lead to get started."}
          </p>
          <Link
            href="/leads/new"
            className="mt-6 inline-flex rounded-lg bg-top-accent px-4 py-2 text-sm font-medium text-top-on-accent"
          >
            Create lead
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-top-border bg-top-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-top-border bg-top-surface-raised text-top-muted">
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
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${item.id}`}
                        className="font-medium text-top-text hover:underline"
                      >
                        {item.firstName} {item.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-top-muted">{item.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-top-muted">{item.email ?? "—"}</td>
                    <td className="px-4 py-3 text-top-muted">
                      {item.primaryCity && item.primaryState
                        ? `${item.primaryCity}, ${item.primaryState}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-top-muted">
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
