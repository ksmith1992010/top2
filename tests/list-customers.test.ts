import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "@/lib/db";
import { customers, organizations, properties } from "@/lib/db/schema";
import { listCustomers } from "@/domain/queries/customers";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("listCustomers", () => {
  it("returns customers with search filter", async () => {
    const db = getDb();

    const [org] = await db
      .insert(organizations)
      .values({ name: `List Test Org ${Date.now()}` })
      .returning();

    const unique = `listtest-${Date.now()}`;
    const [customer] = await db
      .insert(customers)
      .values({
        firstName: "List",
        lastName: unique,
        email: `${unique}@example.com`,
        phone: "555-0100",
      })
      .returning();

    await db.insert(properties).values({
      customerId: customer.id,
      addressLine1: "1 Test St",
      city: "Austin",
      state: "TX",
      zip: "78701",
      isPrimary: true,
    });

    const result = await listCustomers({ search: unique });

    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.items.some((item) => item.id === customer.id)).toBe(true);
    expect(
      result.items.find((item) => item.id === customer.id)?.primaryCity,
    ).toBe("Austin");

    await db.delete(properties).where(eq(properties.customerId, customer.id));
    await db.delete(customers).where(eq(customers.id, customer.id));
    await db.delete(organizations).where(eq(organizations.id, org.id));

    await closeDb();
  });
});
