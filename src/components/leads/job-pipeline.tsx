"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/db/schema/enums";
import { canTransitionJob, JOB_PIPELINE_ORDER } from "@/domain/job-transitions";

type JobPipelineProps = {
  jobId: string;
  currentStatus: JobStatus;
};

export function JobPipeline({ jobId, currentStatus }: JobPipelineProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextStatuses: JobStatus[] = [
    ...JOB_PIPELINE_ORDER.filter((status: JobStatus) => canTransitionJob(currentStatus, status)),
    ...(canTransitionJob(currentStatus, "lost") ? (["lost"] as const) : []),
  ];

  async function transition(toStatus: JobStatus) {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, reason: reason || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? "Transition failed");
        return;
      }

      setReason("");
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-top-muted">
        Current status:{" "}
        <span className="font-medium text-top-navy">{JOB_STATUS_LABELS[currentStatus]}</span>
      </p>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {nextStatuses.length > 0 ? (
        <>
          <label className="block text-sm">
            <span className="text-top-muted">Reason (required for skip or lost)</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <button
                key={status}
                type="button"
                disabled={submitting}
                onClick={() => transition(status)}
                className="rounded-lg border border-top-border bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                → {JOB_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">No further transitions available.</p>
      )}
    </div>
  );
}
