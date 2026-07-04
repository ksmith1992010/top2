"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { JOB_STATUS_LABELS, JOB_STATUSES } from "@/lib/db/schema/enums";

export function JobsFilter({
  initialSearch,
  initialStatus,
}: {
  initialSearch: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);

  function apply(nextSearch: string, nextStatus: string) {
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
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        apply(search, status);
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search job #, customer, or address"
        className="w-full max-w-md rounded-lg border border-top-border px-3 py-2 text-sm"
      />
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          apply(search, e.target.value);
        }}
        className="rounded-lg border border-top-border bg-white px-3 py-2 text-sm"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {JOB_STATUSES.map((value) => (
          <option key={value} value={value}>
            {JOB_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg border border-top-border px-4 py-2 text-sm font-medium text-slate-700"
      >
        Search
      </button>
    </form>
  );
}
