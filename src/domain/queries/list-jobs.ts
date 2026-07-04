import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { customers, jobs, properties } from "@/lib/db/schema";
import { JOB_STATUSES, type JobStatus } from "@/lib/db/schema/enums";

export type JobListItem = {
  id: string;
  jobNumber: string;
  status: JobStatus;
  jobType: string;
  leadSource: string | null;
  createdAt: Date;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  city: string;
  state: string;
};

export type ListJobsInput = {
  organizationId: string;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

export function parseJobStatus(value: string | undefined): JobStatus | undefined {
  return JOB_STATUSES.find((status) => status === value);
}

export async function listJobs(input: ListJobsInput): Promise<{
  items: JobListItem[];
  total: number;
}> {
  const db = getDb();
  const limit = Math.min(input.limit ?? 50, 100);
  const offset = input.offset ?? 0;
  const search = input.search?.trim();
  const status = parseJobStatus(input.status);

  const searchFilter = search
    ? or(
        ilike(jobs.jobNumber, `%${search}%`),
        ilike(customers.firstName, `%${search}%`),
        ilike(customers.lastName, `%${search}%`),
        ilike(sql`concat(${customers.firstName}, ' ', ${customers.lastName})`, `%${search}%`),
        ilike(properties.addressLine1, `%${search}%`),
        ilike(properties.city, `%${search}%`),
      )
    : undefined;

  const whereClause = and(
    eq(jobs.organizationId, input.organizationId),
    isNull(jobs.deletedAt),
    status ? eq(jobs.status, status) : undefined,
    searchFilter,
  );

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobs)
    .innerJoin(properties, eq(properties.id, jobs.propertyId))
    .innerJoin(customers, eq(customers.id, properties.customerId))
    .where(whereClause);

  const items = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      status: jobs.status,
      jobType: jobs.jobType,
      leadSource: jobs.leadSource,
      createdAt: jobs.createdAt,
      customerId: customers.id,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      city: properties.city,
      state: properties.state,
    })
    .from(jobs)
    .innerJoin(properties, eq(properties.id, jobs.propertyId))
    .innerJoin(customers, eq(customers.id, properties.customerId))
    .where(whereClause)
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
    .offset(offset);

  return { items, total: countRow?.count ?? 0 };
}
