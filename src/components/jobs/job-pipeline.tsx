"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/db/schema/enums";
import { checkTransition, JOB_PIPELINE_ORDER } from "@/domain/job-transitions";

type JobPipelineProps = {
  jobId: string;
  currentStatus: JobStatus;
  canGoBackward: boolean;
};

export function JobPipeline({ jobId, currentStatus, canGoBackward }: JobPipelineProps) {
  const router = useRouter();
  const currentIndex = JOB_PIPELINE_ORDER.indexOf(currentStatus);
  const nextStatus = JOB_PIPELINE_ORDER[currentIndex + 1];

  const [target, setTarget] = useState<JobStatus | "">("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const targetCheck = target ? checkTransition(currentStatus, target) : null;
  const needsReason = targetCheck?.ok ? targetCheck.requiresReason : false;

  const moveOptions = JOB_PIPELINE_ORDER.filter((status) => {
    if (status === currentStatus) return false;
    const check = checkTransition(currentStatus, status);
    if (!check.ok) return false;
    if (check.requiresAdmin && !canGoBackward) return false;
    return true;
  });

  async function transition(toStatus: JobStatus, withReason: string) {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, reason: withReason.trim() || undefined }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error?.message ?? "Transition failed");
        return;
      }

      setTarget("");
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
      <ol className="flex gap-1 overflow-x-auto pb-2" aria-label="Job pipeline">
        {JOB_PIPELINE_ORDER.map((status, index) => {
          const state =
            index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
          return (
            <li key={status} className="flex shrink-0 items-center gap-1">
              <span
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                  state === "current"
                    ? "bg-top-navy text-white"
                    : state === "done"
                      ? "bg-top-navy/10 text-top-navy"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {JOB_STATUS_LABELS[status]}
              </span>
              {index < JOB_PIPELINE_ORDER.length - 1 ? (
                <span className="text-slate-300">›</span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {nextStatus ? (
          <div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => transition(nextStatus, "")}
              className="rounded-lg bg-top-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? "Working…" : `Advance to ${JOB_STATUS_LABELS[nextStatus]}`}
            </button>
          </div>
        ) : (
          <p className="text-sm text-top-muted">This job has reached the end of the pipeline.</p>
        )}

        {moveOptions.length > 0 ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (target) {
                transition(target, reason);
              }
            }}
            className="flex flex-col gap-2 rounded-lg border border-top-border bg-slate-50 p-3 sm:flex-row sm:items-end"
          >
            <label className="grid gap-1 text-sm">
              <span className="text-xs text-top-muted">Move to another stage</span>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as JobStatus | "")}
                className="rounded-lg border border-top-border bg-white px-3 py-2 text-sm"
              >
                <option value="">Select stage…</option>
                {moveOptions.map((status) => (
                  <option key={status} value={status}>
                    {JOB_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid flex-1 gap-1 text-sm">
              <span className="text-xs text-top-muted">
                Reason{needsReason ? " (required for skips and backward moves)" : " (optional)"}
              </span>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. retail_cash_job — skipping claim stages"
                className="rounded-lg border border-top-border px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={submitting || !target || (needsReason && !reason.trim())}
              className="rounded-lg border border-top-border bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              Apply
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
