"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LeadsSearch({ initialSearch }: { initialSearch: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    router.push(`/leads?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search name, phone, or email"
        className="w-full max-w-md rounded-lg border border-top-border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-lg border border-top-border px-4 py-2 text-sm font-medium text-slate-700"
      >
        Search
      </button>
    </form>
  );
}
