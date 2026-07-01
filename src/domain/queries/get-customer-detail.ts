import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { customers, jobs, properties } from "@/lib/db/schema";
import type { JobStatus } from "@/lib/db/schema/enums";

export type CustomerDetail = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  primaryProperty: {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    zip: string;
  } | null;
  latestJob: {
    id: string;
    jobNumber: string;
    status: JobStatus;
    jobType: string;
    leadSource: string | null;
  } | null;
};

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const db = getDb();

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), isNull(customers.deletedAt)))
    .limit(1);

  if (!customer) {
    return null;
  }

  const [primaryProperty] = await db
    .select()
    .from(properties)
    .where(
      and(
        eq(properties.customerId, customerId),
        eq(properties.isPrimary, true),
        isNull(properties.deletedAt),
      ),
    )
    .limit(1);

  let latestJob: CustomerDetail["latestJob"] = null;

  if (primaryProperty) {
    const [job] = await db
      .select({
        id: jobs.id,
        jobNumber: jobs.jobNumber,
        status: jobs.status,
        jobType: jobs.jobType,
        leadSource: jobs.leadSource,
      })
      .from(jobs)
      .where(and(eq(jobs.propertyId, primaryProperty.id), isNull(jobs.deletedAt)))
      .orderBy(desc(jobs.createdAt))
      .limit(1);

    if (job) {
      latestJob = job;
    }
  }

  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    notes: customer.notes,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    primaryProperty: primaryProperty
      ? {
          id: primaryProperty.id,
          addressLine1: primaryProperty.addressLine1,
          addressLine2: primaryProperty.addressLine2,
          city: primaryProperty.city,
          state: primaryProperty.state,
          zip: primaryProperty.zip,
        }
      : null,
    latestJob,
  };
}
