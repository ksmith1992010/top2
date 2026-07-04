import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/db/schema/enums";

/** Display-only tone groups for the pipeline stages. */
const STATUS_TONES: Record<JobStatus, string> = {
  lead: "bg-sky-100 text-sky-800",
  inspection_scheduled: "bg-sky-100 text-sky-800",
  inspection_complete: "bg-sky-100 text-sky-800",
  claim_filed: "bg-amber-100 text-amber-800",
  adjuster_meeting_scheduled: "bg-amber-100 text-amber-800",
  approved: "bg-indigo-100 text-indigo-800",
  contract_signed: "bg-indigo-100 text-indigo-800",
  material_ordered: "bg-violet-100 text-violet-800",
  production_scheduled: "bg-violet-100 text-violet-800",
  installed: "bg-violet-100 text-violet-800",
  invoiced: "bg-emerald-100 text-emerald-800",
  paid: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[status]}`}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}
