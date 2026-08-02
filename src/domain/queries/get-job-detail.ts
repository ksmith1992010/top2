import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  customers,
  jobParticipants,
  jobs,
  properties,
  users,
} from "@/lib/db/schema";
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
  salesOwnerName: string | null;
};

export type GetJobDetailInput = {
  jobId: string;
  organizationId: string;
};

export async function getJobDetail(input: GetJobDetailInput): Promise<JobDetail | null> {
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
        eq(jobs.id, input.jobId),
        eq(jobs.organizationId, input.organizationId),
        isNull(jobs.deletedAt),
        isNull(properties.deletedAt),
        isNull(customers.deletedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const [salesOwner] = await db
    .select({ name: users.name })
    .from(jobParticipants)
    .innerJoin(users, eq(users.id, jobParticipants.userId))
    .where(
      and(
        eq(jobParticipants.jobId, row.id),
        eq(jobParticipants.role, "sales_owner"),
        isNull(jobParticipants.removedAt),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

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
    salesOwnerName: salesOwner?.name ?? null,
  };
}
