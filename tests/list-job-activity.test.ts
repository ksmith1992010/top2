import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { listJobActivity } from "@/domain/queries/list-job-activity";
import { closeDb, getDb } from "@/lib/db";
import {
  activityEvents,
  customers,
  jobs,
  organizations,
  properties,
  users,
} from "@/lib/db/schema";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("listJobActivity", () => {
  it("returns org-scoped timeline with job and customer-level events", async () => {
    const db = getDb();
    const stamp = Date.now();

    const [orgA] = await db
      .insert(organizations)
      .values({ name: `Timeline Org A ${stamp}` })
      .returning();
    const [orgB] = await db
      .insert(organizations)
      .values({ name: `Timeline Org B ${stamp}` })
      .returning();

    const [actor] = await db
      .insert(users)
      .values({
        organizationId: orgA.id,
        email: `timeline-actor-${stamp}@example.com`,
        name: "Timeline Actor",
      })
      .returning();

    const [customer] = await db
      .insert(customers)
      .values({
        firstName: "Timeline",
        lastName: "Homeowner",
        email: `timeline-customer-${stamp}@example.com`,
      })
      .returning();

    const [property] = await db
      .insert(properties)
      .values({
        customerId: customer.id,
        addressLine1: "200 Timeline Ave",
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
        jobNumber: `TOP-TA-${stamp}`,
        status: "lead",
        jobType: "insurance",
      })
      .returning();

    const [jobB] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: orgB.id,
        jobNumber: `TOP-TB-${stamp}`,
        status: "lead",
        jobType: "retail",
      })
      .returning();

    await db.insert(activityEvents).values([
      {
        jobId: jobA.id,
        customerId: customer.id,
        actorId: actor.id,
        eventType: "customer.created",
        subjectType: "customer",
        subjectId: customer.id,
        payload: { jobNumber: jobA.jobNumber },
        occurredAt: new Date(stamp),
      },
      {
        jobId: jobA.id,
        customerId: customer.id,
        actorId: actor.id,
        eventType: "job.status_changed",
        subjectType: "job",
        subjectId: jobA.id,
        payload: { from: "lead", to: "inspection_scheduled" },
        occurredAt: new Date(stamp + 1000),
      },
      {
        customerId: customer.id,
        actorId: actor.id,
        eventType: "customer.updated",
        subjectType: "customer",
        subjectId: customer.id,
        payload: {},
        occurredAt: new Date(stamp + 2000),
      },
      {
        jobId: jobB.id,
        customerId: customer.id,
        actorId: actor.id,
        eventType: "job.status_changed",
        subjectType: "job",
        subjectId: jobB.id,
        payload: { from: "lead", to: "approved" },
        occurredAt: new Date(stamp + 3000),
      },
    ]);

    const timeline = await listJobActivity({
      jobId: jobA.id,
      organizationId: orgA.id,
    });

    expect(timeline).not.toBeNull();
    expect(timeline?.total).toBe(3);
    expect(timeline?.items.map((item) => item.eventType)).toEqual([
      "customer.updated",
      "job.status_changed",
      "customer.created",
    ]);
    expect(timeline?.items[1]?.summary).toBe(
      "Status changed from New Lead to Inspection Scheduled",
    );
    expect(timeline?.items.every((item) => item.actorName === "Timeline Actor")).toBe(true);
    expect(JSON.stringify(timeline)).not.toContain("approved");

    const crossOrg = await listJobActivity({
      jobId: jobB.id,
      organizationId: orgA.id,
    });
    expect(crossOrg).toBeNull();

    await db.update(jobs).set({ deletedAt: new Date() }).where(eq(jobs.id, jobA.id));
    const softDeleted = await listJobActivity({
      jobId: jobA.id,
      organizationId: orgA.id,
    });
    expect(softDeleted).toBeNull();

    await db.delete(activityEvents).where(eq(activityEvents.customerId, customer.id));
    await db.delete(jobs).where(eq(jobs.id, jobA.id));
    await db.delete(jobs).where(eq(jobs.id, jobB.id));
    await db.delete(properties).where(eq(properties.id, property.id));
    await db.delete(customers).where(eq(customers.id, customer.id));
    await db.delete(users).where(eq(users.id, actor.id));
    await db.delete(organizations).where(eq(organizations.id, orgA.id));
    await db.delete(organizations).where(eq(organizations.id, orgB.id));
    await closeDb();
  });
});
