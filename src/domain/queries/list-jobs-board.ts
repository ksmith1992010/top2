import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { customers, jobs, properties } from "@/lib/db/schema";
import { type JobStatus } from "@/lib/db/schema/enums";
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  STATUS_TO_STAGE,
  type PipelineStage,
} from "@/lib/pipeline-stages";

export type BoardJobItem = {
  id: string;
  jobNumber: string;
  status: JobStatus;
  customerName: string;
  city: string;
  state: string;
  updatedAt: Date;
};

export type BoardColumn = {
  stage: PipelineStage;
  label: string;
  items: BoardJobItem[];
  total: number;
};

export type ListJobsBoardInput = {
  organizationId: string;
};

export type ListJobsBoardResult = {
  columns: BoardColumn[];
  totalJobs: number;
};

/**
 * Org-scoped pipeline board data. Read-only; groups every live job into the nine
 * field pipeline stages. Jobs keep their canonical `job_status` — the stage is a
 * display grouping, so no write path is involved.
 *
 * Cards are newest-first (`updated_at desc`), with `id desc` as a stable
 * tie-breaker so equal timestamps never reorder between renders.
 */
export async function listJobsBoard(
  input: ListJobsBoardInput,
): Promise<ListJobsBoardResult> {
  const db = getDb();

  const rows = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      status: jobs.status,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      city: properties.city,
      state: properties.state,
      updatedAt: jobs.updatedAt,
    })
    .from(jobs)
    .innerJoin(properties, eq(properties.id, jobs.propertyId))
    .innerJoin(customers, eq(customers.id, properties.customerId))
    .where(
      and(
        eq(jobs.organizationId, input.organizationId),
        isNull(jobs.deletedAt),
        isNull(properties.deletedAt),
        isNull(customers.deletedAt),
      ),
    )
    .orderBy(desc(jobs.updatedAt), desc(jobs.id));

  const byStage = new Map<PipelineStage, BoardJobItem[]>();
  for (const stage of PIPELINE_STAGES) {
    byStage.set(stage, []);
  }

  for (const row of rows) {
    const bucket = byStage.get(STATUS_TO_STAGE[row.status]);
    if (!bucket) {
      continue;
    }
    bucket.push({
      id: row.id,
      jobNumber: row.jobNumber,
      status: row.status,
      customerName: `${row.customerFirstName} ${row.customerLastName}`.trim(),
      city: row.city,
      state: row.state,
      updatedAt: row.updatedAt,
    });
  }

  const columns: BoardColumn[] = PIPELINE_STAGES.map((stage) => {
    const items = byStage.get(stage) ?? [];
    return {
      stage,
      label: STAGE_LABELS[stage],
      items,
      total: items.length,
    };
  });

  const totalJobs = columns.reduce((sum, column) => sum + column.total, 0);

  return { columns, totalJobs };
}
