import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { listJobsBoard } from "@/domain/queries/list-jobs-board";
import { closeDb, getDb } from "@/lib/db";
import { customers, jobs, organizations, properties } from "@/lib/db/schema";
import { JOB_STATUSES } from "@/lib/db/schema/enums";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("listJobsBoard", () => {
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
    expect(board.visibleCount).toBe(2);

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
    await closeDb();
  });
});
