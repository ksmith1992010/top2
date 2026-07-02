import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDb } from "@/lib/db";
import { activityEvents, customers, jobs, properties } from "@/lib/db/schema";
import type * as schema from "@/lib/db/schema";
import type { CreateCustomerInput } from "@/domain/schemas/customer";
import { DomainError } from "@/domain/errors";
import { generateJobNumber } from "@/lib/job-numbers";

type Db = PostgresJsDatabase<typeof schema>;

/**
 * Serializes customer contact-uniqueness checks across concurrent
 * transactions. Take this lock (inside a transaction) before checking for
 * duplicates so two simultaneous writes can't both pass the check.
 */
export async function lockCustomerContact(db: Db) {
  await db.execute(sql`SELECT pg_advisory_xact_lock(hashtext('customers:contact'))`);
}

async function findDuplicateCustomer(
  db: Db,
  email: string | undefined,
  phone: string | undefined,
) {
  if (!email && !phone) {
    return null;
  }

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

  const db = getDb();

  return db.transaction(async (tx) => {
    await lockCustomerContact(tx);

    const duplicate = await findDuplicateCustomer(tx, email ?? undefined, phone ?? undefined);
    if (duplicate) {
      throw new DomainError(
        "DUPLICATE_CUSTOMER",
        "A customer with this email or phone already exists",
      );
    }

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
