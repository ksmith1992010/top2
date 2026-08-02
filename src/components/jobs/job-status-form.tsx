"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/db/schema/enums";

type JobStatusFormProps = {
  jobId: string;
  currentStatus: JobStatus;
};

export function JobStatusForm({ jobId, currentStatus }: JobStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? "Failed to update status");
        return;
      }

      setSuccess(data.changed === false ? "Status unchanged" : "Status updated");
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-xs text-top-muted">Current stage</p>
        <p className="mt-1 text-sm font-medium text-top-text">
          {JOB_STATUS_LABELS[currentStatus]}
        </p>
      </div>

      <div>
        <label htmlFor="job-status" className="text-xs text-top-muted">
          Move job
        </label>
        <select
          id="job-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as JobStatus)}
          className="mt-1 w-full max-w-md rounded-lg border border-top-border bg-top-surface-raised px-3 py-2 text-sm text-top-text"
          disabled={submitting}
        >
          {JOB_STATUSES.map((value) => (
            <option key={value} value={value}>
              {JOB_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-top-gold" role="status">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-top-gold px-4 py-2 text-sm font-semibold text-top-navy disabled:opacity-60"
      >
        {submitting ? "Updating…" : "Update status"}
      </button>
    </form>
  );
}
