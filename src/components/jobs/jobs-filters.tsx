"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/db/schema/enums";

type JobsFiltersProps = {
  initialSearch: string;
  initialStatus: string;
};

export function JobsFilters({ initialSearch, initialStatus }: JobsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);

  function applyFilters(nextSearch: string, nextStatus: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    } else {
      params.delete("search");
    }
    if (nextStatus) {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }
    const query = params.toString();
    router.push(query ? `/jobs?${query}` : "/jobs");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    applyFilters(search, status);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search job #, customer, or address"
        className="w-full max-w-md rounded-lg border border-top-border bg-top-surface-raised px-3 py-2 text-sm text-top-text"
      />
      <select
        value={status}
        onChange={(event) => {
          const next = event.target.value;
          setStatus(next);
          applyFilters(search, next);
        }}
        className="rounded-lg border border-top-border bg-top-surface-raised px-3 py-2 text-sm text-top-text"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {JOB_STATUSES.map((value) => (
          <option key={value} value={value}>
            {JOB_STATUS_LABELS[value as JobStatus]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg border border-top-border px-4 py-2 text-sm font-medium text-top-text hover:bg-top-surface-raised"
      >
        Search
      </button>
    </form>
  );
}
