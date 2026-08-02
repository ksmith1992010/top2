import { and, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  customers,
  jobParticipants,
  jobs,
  properties,
  users,
} from "@/lib/db/schema";
import type { JobStatus } from "@/lib/db/schema/enums";
import { normalizeJobSearch } from "@/lib/job-search";
import { resolveJobStatus } from "@/lib/job-status";

export const DEFAULT_JOB_LIST_LIMIT = 50;
export const MAX_JOB_LIST_LIMIT = 100;

export type JobListItem = {
  id: string;
  jobNumber: string;
  status: JobStatus;
  jobType: string;
  leadSource: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  customerName: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  salesOwnerName: string | null;
};

export type ListJobsInput = {
  organizationId: string;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

export async function listJobs(input: ListJobsInput): Promise<{
  items: JobListItem[];
  total: number;
  limit: number;
  offset: number;
}> {
  const db = getDb();
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_JOB_LIST_LIMIT, 1), MAX_JOB_LIST_LIMIT);
  const offset = Math.max(input.offset ?? 0, 0);
  const search = normalizeJobSearch(input.search);
  const status = resolveJobStatus(input.status);

  const salesOwner = db
    .select({
      jobId: jobParticipants.jobId,
      salesOwnerName: users.name,
    })
    .from(jobParticipants)
    .innerJoin(users, eq(users.id, jobParticipants.userId))
    .where(
      and(
        eq(jobParticipants.role, "sales_owner"),
        isNull(jobParticipants.removedAt),
        isNull(users.deletedAt),
      ),
    )
    .as("sales_owner");

  const filters: SQL[] = [
    eq(jobs.organizationId, input.organizationId),
    isNull(jobs.deletedAt),
    isNull(properties.deletedAt),
    isNull(customers.deletedAt),
  ];

  if (status) {
    filters.push(eq(jobs.status, status));
  }

  if (search) {
    const pattern = `%${search}%`;
    const searchFilter = or(
      ilike(jobs.jobNumber, pattern),
      ilike(customers.firstName, pattern),
      ilike(customers.lastName, pattern),
      ilike(sql`concat(${customers.firstName}, ' ', ${customers.lastName})`, pattern),
      ilike(properties.addressLine1, pattern),
      ilike(properties.city, pattern),
      ilike(properties.zip, pattern),
    );
    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  const whereClause = and(...filters);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobs)
    .innerJoin(properties, eq(properties.id, jobs.propertyId))
    .innerJoin(customers, eq(customers.id, properties.customerId))
    .where(whereClause);

  const rows = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      status: jobs.status,
      jobType: jobs.jobType,
      leadSource: jobs.leadSource,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      customerId: customers.id,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      addressLine1: properties.addressLine1,
      city: properties.city,
      state: properties.state,
      zip: properties.zip,
      salesOwnerName: salesOwner.salesOwnerName,
    })
    .from(jobs)
    .innerJoin(properties, eq(properties.id, jobs.propertyId))
    .innerJoin(customers, eq(customers.id, properties.customerId))
    .leftJoin(salesOwner, eq(salesOwner.jobId, jobs.id))
    .where(whereClause)
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      id: row.id,
      jobNumber: row.jobNumber,
      status: row.status,
      jobType: row.jobType,
      leadSource: row.leadSource,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      customerId: row.customerId,
      customerName: `${row.customerFirstName} ${row.customerLastName}`.trim(),
      addressLine1: row.addressLine1,
      city: row.city,
      state: row.state,
      zip: row.zip,
      salesOwnerName: row.salesOwnerName,
    })),
    total: countRow?.count ?? 0,
    limit,
    offset,
  };
}
