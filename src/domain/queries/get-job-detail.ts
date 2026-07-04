import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { customers, jobs, properties } from "@/lib/db/schema";
import type { JobStatus } from "@/lib/db/schema/enums";

export type JobDetail = {
  id: string;
  jobNumber: string;
  status: JobStatus;
  jobType: string;
  leadSource: string | null;
  stormDate: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  property: {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    zip: string;
  };
};

export async function getJobDetail(
  jobId: string,
  organizationId: string,
): Promise<JobDetail | null> {
  const db = getDb();

  const [row] = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      status: jobs.status,
      jobType: jobs.jobType,
      leadSource: jobs.leadSource,
      stormDate: jobs.stormDate,
      notes: jobs.notes,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      closedAt: jobs.closedAt,
      customerId: customers.id,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerEmail: customers.email,
      customerPhone: customers.phone,
      propertyId: properties.id,
      addressLine1: properties.addressLine1,
      addressLine2: properties.addressLine2,
      city: properties.city,
      state: properties.state,
      zip: properties.zip,
    })
    .from(jobs)
    .innerJoin(properties, eq(properties.id, jobs.propertyId))
    .innerJoin(customers, eq(customers.id, properties.customerId))
    .where(
      and(
        eq(jobs.id, jobId),
        eq(jobs.organizationId, organizationId),
        isNull(jobs.deletedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    jobNumber: row.jobNumber,
    status: row.status,
    jobType: row.jobType,
    leadSource: row.leadSource,
    stormDate: row.stormDate,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    closedAt: row.closedAt,
    customer: {
      id: row.customerId,
      firstName: row.customerFirstName,
      lastName: row.customerLastName,
      email: row.customerEmail,
      phone: row.customerPhone,
    },
    property: {
      id: row.propertyId,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      city: row.city,
      state: row.state,
      zip: row.zip,
    },
  };
}
