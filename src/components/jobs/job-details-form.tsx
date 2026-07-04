"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type JobDetailsFormProps = {
  jobId: string;
  initial: {
    notes: string;
    leadSource: string;
    stormDate: string;
    jobType: string;
  };
};

export function JobDetailsForm({ jobId, initial }: JobDetailsFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initial.notes);
  const [leadSource, setLeadSource] = useState(initial.leadSource);
  const [stormDate, setStormDate] = useState(initial.stormDate);
  const [jobType, setJobType] = useState(initial.jobType);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const response = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes,
        leadSource,
        stormDate: stormDate || null,
        jobType,
      }),
    });

    setIsSaving(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message ?? "Failed to save job details");
      return;
    }

    router.push(`/jobs/${jobId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">
        <span className="text-xs text-top-muted">Job type</span>
        <select
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          className="rounded-lg border border-top-border bg-white px-3 py-2 text-sm"
        >
          <option value="insurance">Insurance</option>
          <option value="retail">Retail</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-xs text-top-muted">Lead source</span>
        <input
          type="text"
          value={leadSource}
          onChange={(e) => setLeadSource(e.target.value)}
          placeholder="door_knock, referral, storm_list…"
          className="rounded-lg border border-top-border px-3 py-2 text-sm"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-xs text-top-muted">Storm date</span>
        <input
          type="date"
          value={stormDate}
          onChange={(e) => setStormDate(e.target.value)}
          className="rounded-lg border border-top-border px-3 py-2 text-sm"
        />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        <span className="text-xs text-top-muted">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="rounded-lg border border-top-border px-3 py-2 text-sm"
        />
      </label>
      {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-top-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save details"}
        </button>
      </div>
    </form>
  );
}
