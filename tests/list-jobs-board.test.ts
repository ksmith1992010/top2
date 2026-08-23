import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { listJobsBoard } from "@/domain/queries/list-jobs-board";
import { closeDb, getDb } from "@/lib/db";
import { customers, jobs, organizations, properties } from "@/lib/db/schema";
import { JOB_STATUSES } from "@/lib/db/schema/enums";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("listJobsBoard", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("groups org jobs by status and excludes soft-deleted and cross-org rows", async () => {
    const db = getDb();
    const stamp = Date.now();

    const [orgA] = await db
      .insert(organizations)
      .values({ name: `Board Org A ${stamp}` })
      .returning();
    const [orgB] = await db
      .insert(organizations)
      .values({ name: `Board Org B ${stamp}` })
      .returning();

    const [customer] = await db
      .insert(customers)
      .values({
        firstName: "Board",
        lastName: "Homeowner",
        email: `board-${stamp}@example.com`,
      })
      .returning();

    const [property] = await db
      .insert(properties)
      .values({
        customerId: customer.id,
        addressLine1: "300 Board St",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        isPrimary: true,
      })
      .returning();

    const [leadJob] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: orgA.id,
        jobNumber: `TOP-BL-${stamp}`,
        status: "lead",
        jobType: "insurance",
      })
      .returning();

    const [claimJob] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: orgA.id,
        jobNumber: `TOP-BC-${stamp}`,
        status: "claim_filed",
        jobType: "insurance",
      })
      .returning();

    const [otherOrgJob] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: orgB.id,
        jobNumber: `TOP-BX-${stamp}`,
        status: "lead",
        jobType: "retail",
      })
      .returning();

    const [softDeleted] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: orgA.id,
        jobNumber: `TOP-BD-${stamp}`,
        status: "approved",
        jobType: "insurance",
        deletedAt: new Date(),
      })
      .returning();

    const board = await listJobsBoard({ organizationId: orgA.id });

    expect(board.columns).toHaveLength(JOB_STATUSES.length);
    expect(board.totalJobs).toBe(2);

    const leadColumn = board.columns.find((column) => column.status === "lead");
    const claimColumn = board.columns.find((column) => column.status === "claim_filed");
    const approvedColumn = board.columns.find((column) => column.status === "approved");

    expect(leadColumn?.total).toBe(1);
    expect(leadColumn?.items.map((item) => item.id)).toEqual([leadJob.id]);
    expect(claimColumn?.items.map((item) => item.id)).toEqual([claimJob.id]);
    expect(approvedColumn?.total).toBe(0);
    expect(approvedColumn?.items).toHaveLength(0);

    const allIds = board.columns.flatMap((column) => column.items.map((item) => item.id));
    expect(allIds).not.toContain(otherOrgJob.id);
    expect(allIds).not.toContain(softDeleted.id);

    await db.delete(jobs).where(eq(jobs.id, leadJob.id));
    await db.delete(jobs).where(eq(jobs.id, claimJob.id));
    await db.delete(jobs).where(eq(jobs.id, otherOrgJob.id));
    await db.delete(jobs).where(eq(jobs.id, softDeleted.id));
    await db.delete(properties).where(eq(properties.id, property.id));
    await db.delete(customers).where(eq(customers.id, customer.id));
    await db.delete(organizations).where(eq(organizations.id, orgA.id));
    await db.delete(organizations).where(eq(organizations.id, orgB.id));
  });

  it("orders cards in a stage newest-first with a stable id tie-breaker", async () => {
    const db = getDb();
    const stamp = Date.now();

    const [org] = await db
      .insert(organizations)
      .values({ name: `Board Order Org ${stamp}` })
      .returning();

    const [customer] = await db
      .insert(customers)
      .values({
        firstName: "Order",
        lastName: "Homeowner",
        email: `board-order-${stamp}@example.com`,
      })
      .returning();

    const [property] = await db
      .insert(properties)
      .values({
        customerId: customer.id,
        addressLine1: "400 Order St",
        city: "Fort Worth",
        state: "TX",
        zip: "76102",
        isPrimary: true,
      })
      .returning();

    const oldest = new Date("2026-01-01T00:00:00.000Z");
    const newest = new Date("2026-03-01T00:00:00.000Z");
    // Two rows deliberately share `newest` so the id tie-breaker is exercised.
    const [staleJob] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: org.id,
        jobNumber: `TOP-OA-${stamp}`,
        status: "inspection_scheduled",
        jobType: "insurance",
        updatedAt: oldest,
      })
      .returning();

    const [tiedOne] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: org.id,
        jobNumber: `TOP-OB-${stamp}`,
        status: "inspection_scheduled",
        jobType: "insurance",
        updatedAt: newest,
      })
      .returning();

    const [tiedTwo] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: org.id,
        jobNumber: `TOP-OC-${stamp}`,
        status: "inspection_scheduled",
        jobType: "insurance",
        updatedAt: newest,
      })
      .returning();

    // A job in another stage must not disturb this column's ordering.
    const [otherStageJob] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: org.id,
        jobNumber: `TOP-OD-${stamp}`,
        status: "approved",
        jobType: "insurance",
        updatedAt: newest,
      })
      .returning();

    const board = await listJobsBoard({ organizationId: org.id });

    const column = board.columns.find(
      (entry) => entry.status === "inspection_scheduled",
    );

    expect(column?.total).toBe(3);
    expect(column?.items).toHaveLength(3);

    // Newest first, and the stale row is last regardless of insertion order.
    const ids = column?.items.map((item) => item.id) ?? [];
    const tiedIds = [tiedOne.id, tiedTwo.id].sort().reverse();
    expect(ids).toEqual([...tiedIds, staleJob.id]);

    // Repeat calls return the same order — no timestamp-tie flapping.
    const second = await listJobsBoard({ organizationId: org.id });
    const secondIds =
      second.columns
        .find((entry) => entry.status === "inspection_scheduled")
        ?.items.map((item) => item.id) ?? [];
    expect(secondIds).toEqual(ids);

    await db.delete(jobs).where(eq(jobs.id, staleJob.id));
    await db.delete(jobs).where(eq(jobs.id, tiedOne.id));
    await db.delete(jobs).where(eq(jobs.id, tiedTwo.id));
    await db.delete(jobs).where(eq(jobs.id, otherStageJob.id));
    await db.delete(properties).where(eq(properties.id, property.id));
    await db.delete(customers).where(eq(customers.id, customer.id));
    await db.delete(organizations).where(eq(organizations.id, org.id));
  });
});
