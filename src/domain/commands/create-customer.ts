import { and, eq, isNull, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { activityEvents, customers, jobs, properties } from "@/lib/db/schema";
import type { CreateCustomerInput } from "@/domain/schemas/customer";
import { generateJobNumber } from "@/lib/job-numbers";

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function findDuplicateCustomer(email: string | undefined, phone: string | undefined) {
  if (!email && !phone) {
    return null;
  }

  const db = getDb();
  const conditions = [];

  if (email) {
    conditions.push(eq(customers.email, email));
  }
  if (phone) {
    conditions.push(eq(customers.phone, phone));
  }

  const [existing] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(isNull(customers.deletedAt), or(...conditions)))
    .limit(1);

  return existing ?? null;
}

export async function createCustomerCommand(input: {
  data: CreateCustomerInput;
  actorId: string;
  organizationId: string;
}) {
  const { data, actorId, organizationId } = input;
  const email = data.email?.trim() || null;
  const phone = data.phone?.trim() || null;

  const duplicate = await findDuplicateCustomer(email ?? undefined, phone ?? undefined);
  if (duplicate) {
    throw new DomainError("DUPLICATE_CUSTOMER", "A customer with this email or phone already exists");
  }

  const db = getDb();

  return db.transaction(async (tx) => {
    const [customer] = await tx
      .insert(customers)
      .values({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email,
        phone,
        notes: data.notes?.trim() || null,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();

    const [property] = await tx
      .insert(properties)
      .values({
        customerId: customer.id,
        addressLine1: data.property.addressLine1.trim(),
        addressLine2: data.property.addressLine2?.trim() || null,
        city: data.property.city.trim(),
        state: data.property.state.trim().toUpperCase(),
        zip: data.property.zip.trim(),
        isPrimary: true,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();

    const jobNumber = await generateJobNumber(tx);

    const [job] = await tx
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId,
        jobNumber,
        status: "lead",
        jobType: data.jobType,
        leadSource: data.leadSource?.trim() || null,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();

    await tx.insert(activityEvents).values({
      jobId: job.id,
      customerId: customer.id,
      actorId,
      eventType: "customer.created",
      subjectType: "customer",
      subjectId: customer.id,
      payload: { jobNumber: job.jobNumber },
    });

    return { customer, property, job };
  });
}
