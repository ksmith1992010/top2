import { and, eq, isNull, ne, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { activityEvents, customers, properties } from "@/lib/db/schema";
import type { UpdateCustomerInput } from "@/domain/schemas/customer";
import { DomainError } from "@/domain/commands/create-customer";

export async function updateCustomerCommand(input: {
  customerId: string;
  data: UpdateCustomerInput;
  actorId: string;
}) {
  const { customerId, data, actorId } = input;
  const db = getDb();

  const [existing] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), isNull(customers.deletedAt)))
    .limit(1);

  if (!existing) {
    throw new DomainError("NOT_FOUND", "Customer not found");
  }

  const email = data.email !== undefined ? data.email.trim() || null : undefined;
  const phone = data.phone !== undefined ? data.phone.trim() || null : undefined;

  if (email || phone) {
    const conditions = [];
    if (email) {
      conditions.push(eq(customers.email, email));
    }
    if (phone) {
      conditions.push(eq(customers.phone, phone));
    }

    const [duplicate] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(isNull(customers.deletedAt), ne(customers.id, customerId), or(...conditions)),
      )
      .limit(1);

    if (duplicate) {
      throw new DomainError(
        "DUPLICATE_CUSTOMER",
        "Another customer already uses this email or phone",
      );
    }
  }

  return db.transaction(async (tx) => {
    const updates: Partial<typeof customers.$inferInsert> = {
      updatedBy: actorId,
      updatedAt: new Date(),
    };

    if (data.firstName !== undefined) updates.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updates.lastName = data.lastName.trim();
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (data.notes !== undefined) updates.notes = data.notes.trim() || null;

    const [customer] = await tx
      .update(customers)
      .set(updates)
      .where(eq(customers.id, customerId))
      .returning();

    if (data.property) {
      const [primaryProperty] = await tx
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

      if (primaryProperty) {
        const propertyUpdates: Partial<typeof properties.$inferInsert> = {
          updatedBy: actorId,
          updatedAt: new Date(),
        };

        if (data.property.addressLine1 !== undefined) {
          propertyUpdates.addressLine1 = data.property.addressLine1.trim();
        }
        if (data.property.addressLine2 !== undefined) {
          propertyUpdates.addressLine2 = data.property.addressLine2.trim() || null;
        }
        if (data.property.city !== undefined) propertyUpdates.city = data.property.city.trim();
        if (data.property.state !== undefined) {
          propertyUpdates.state = data.property.state.trim().toUpperCase();
        }
        if (data.property.zip !== undefined) propertyUpdates.zip = data.property.zip.trim();

        await tx.update(properties).set(propertyUpdates).where(eq(properties.id, primaryProperty.id));
      }
    }

    await tx.insert(activityEvents).values({
      customerId: customer.id,
      actorId,
      eventType: "customer.updated",
      subjectType: "customer",
      subjectId: customer.id,
      payload: {},
    });

    return customer;
  });
}
