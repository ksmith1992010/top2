import { and, eq, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { customers, jobs, properties } from "@/lib/db/schema";
import {
  JOB_STATUS_LABELS,
  JOB_STATUSES,
  type JobStatus,
} from "@/lib/db/schema/enums";

export const DEFAULT_BOARD_COLUMN_LIMIT = 15;
export const MAX_BOARD_COLUMN_LIMIT = 30;

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
  status: JobStatus;
  label: string;
  items: BoardJobItem[];
  total: number;
};

export type ListJobsBoardInput = {
  organizationId: string;
  perColumnLimit?: number;
};

export type ListJobsBoardResult = {
  columns: BoardColumn[];
  visibleCount: number;
  totalJobs: number;
  perColumnLimit: number;
};

/**
 * Org-scoped pipeline board data. Read-only; groups jobs by canonical status.
 * Loads up to `perColumnLimit` newest jobs per status (windowed), not an unbounded set.
 */
export async function listJobsBoard(
  input: ListJobsBoardInput,
): Promise<ListJobsBoardResult> {
  const db = getDb();
  const perColumnLimit = Math.min(
    Math.max(input.perColumnLimit ?? DEFAULT_BOARD_COLUMN_LIMIT, 1),
    MAX_BOARD_COLUMN_LIMIT,
  );

  const filters = and(
    eq(jobs.organizationId, input.organizationId),
    isNull(jobs.deletedAt),
    isNull(properties.deletedAt),
    isNull(customers.deletedAt),
  );

  const countRows = await db
    .select({
      status: jobs.status,
      count: sql<number>`count(*)::int`,
    })
    .from(jobs)
    .innerJoin(properties, eq(properties.id, jobs.propertyId))
    .innerJoin(customers, eq(customers.id, properties.customerId))
    .where(filters)
    .groupBy(jobs.status);

  const totals = new Map<JobStatus, number>();
  for (const row of countRows) {
    totals.set(row.status, row.count);
  }

  const ranked = db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      status: jobs.status,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      city: properties.city,
      state: properties.state,
      updatedAt: jobs.updatedAt,
      rn: sql<number>`row_number() over (partition by ${jobs.status} order by ${jobs.updatedAt} desc)`.as(
        "rn",
      ),
    })
    .from(jobs)
    .innerJoin(properties, eq(properties.id, jobs.propertyId))
    .innerJoin(customers, eq(customers.id, properties.customerId))
    .where(filters)
    .as("board_ranked");

  const rows = await db
    .select({
      id: ranked.id,
      jobNumber: ranked.jobNumber,
      status: ranked.status,
      customerFirstName: ranked.customerFirstName,
      customerLastName: ranked.customerLastName,
      city: ranked.city,
      state: ranked.state,
      updatedAt: ranked.updatedAt,
    })
    .from(ranked)
    .where(lte(ranked.rn, perColumnLimit));

  const byStatus = new Map<JobStatus, BoardJobItem[]>();
  for (const status of JOB_STATUSES) {
    byStatus.set(status, []);
  }

  for (const row of rows) {
    const bucket = byStatus.get(row.status);
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

  const columns: BoardColumn[] = JOB_STATUSES.map((status) => ({
    status,
    label: JOB_STATUS_LABELS[status],
    items: byStatus.get(status) ?? [],
    total: totals.get(status) ?? 0,
  }));

  const visibleCount = columns.reduce((sum, column) => sum + column.items.length, 0);
  const totalJobs = columns.reduce((sum, column) => sum + column.total, 0);

  return {
    columns,
    visibleCount,
    totalJobs,
    perColumnLimit,
  };
}
