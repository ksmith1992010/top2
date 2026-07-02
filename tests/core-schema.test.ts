import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, closeDb } from "@/lib/db";
import { customers, jobs, organizations, properties } from "@/lib/db/schema";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("core domain schema", () => {
  it("supports customer → property → job FK chain", async () => {
    const db = getDb();

    const [org] = await db
      .insert(organizations)
      .values({ name: `Test Org ${Date.now()}` })
      .returning();

    const [customer] = await db
      .insert(customers)
      .values({
        firstName: "Test",
        lastName: "Lead",
        email: `test-${Date.now()}@example.com`,
      })
      .returning();

    const [property] = await db
      .insert(properties)
      .values({
        customerId: customer.id,
        addressLine1: "123 Main St",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        isPrimary: true,
      })
      .returning();

    const [job] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: org.id,
        jobNumber: `TOP-${Date.now()}`,
        status: "lead",
      })
      .returning();

    expect(job.status).toBe("lead");

    await db.delete(jobs).where(eq(jobs.id, job.id));
    await db.delete(properties).where(eq(properties.id, property.id));
    await db.delete(customers).where(eq(customers.id, customer.id));
    await db.delete(organizations).where(eq(organizations.id, org.id));

    await closeDb();
  });
});
