import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "@/lib/db";
import { customers, jobs, organizations, properties } from "@/lib/db/schema";
import { getJobDetail } from "@/domain/queries/get-job-detail";
import { listJobs } from "@/domain/queries/list-jobs";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("jobs queries", () => {
  it("lists and details jobs scoped by organization", async () => {
    const db = getDb();
    const stamp = Date.now();

    const [orgA] = await db
      .insert(organizations)
      .values({ name: `Jobs Org A ${stamp}` })
      .returning();
    const [orgB] = await db
      .insert(organizations)
      .values({ name: `Jobs Org B ${stamp}` })
      .returning();

    const [customer] = await db
      .insert(customers)
      .values({
        firstName: "Storm",
        lastName: "Homeowner",
        email: `jobs-${stamp}@example.com`,
      })
      .returning();

    const [property] = await db
      .insert(properties)
      .values({
        customerId: customer.id,
        addressLine1: "500 Roof Run",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        isPrimary: true,
      })
      .returning();

    const [jobA] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: orgA.id,
        jobNumber: `TOP-A-${stamp}`,
        status: "lead",
        jobType: "insurance",
      })
      .returning();

    const [jobB] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: orgB.id,
        jobNumber: `TOP-B-${stamp}`,
        status: "claim_filed",
        jobType: "retail",
      })
      .returning();

    const listedA = await listJobs({ organizationId: orgA.id, search: "Roof Run" });
    expect(listedA.items.map((item) => item.id)).toContain(jobA.id);
    expect(listedA.items.map((item) => item.id)).not.toContain(jobB.id);
    expect(listedA.items.find((item) => item.id === jobA.id)?.customerName).toContain(
      "Storm Homeowner",
    );

    const detailA = await getJobDetail({ jobId: jobA.id, organizationId: orgA.id });
    expect(detailA?.jobNumber).toBe(`TOP-A-${stamp}`);
    expect(detailA?.property.city).toBe("Dallas");

    const leaked = await getJobDetail({ jobId: jobB.id, organizationId: orgA.id });
    expect(leaked).toBeNull();

    const statusFiltered = await listJobs({
      organizationId: orgB.id,
      status: "claim_filed",
    });
    expect(statusFiltered.items.map((item) => item.id)).toContain(jobB.id);
    expect(statusFiltered.items.every((item) => item.status === "claim_filed")).toBe(true);

    await db.delete(jobs).where(eq(jobs.id, jobA.id));
    await db.delete(jobs).where(eq(jobs.id, jobB.id));
    await db.delete(properties).where(eq(properties.id, property.id));
    await db.delete(customers).where(eq(customers.id, customer.id));
    await db.delete(organizations).where(eq(organizations.id, orgA.id));
    await db.delete(organizations).where(eq(organizations.id, orgB.id));
    await closeDb();
  });
});
