import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { updateJobStatusCommand } from "@/domain/commands/update-job-status";
import { DomainError } from "@/domain/errors";
import { updateJobStatusSchema } from "@/domain/schemas/job";
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

describe("updateJobStatusSchema", () => {
  it("accepts canonical statuses and rejects invalid values", () => {
    expect(updateJobStatusSchema.safeParse({ status: "lead" }).success).toBe(true);
    expect(updateJobStatusSchema.safeParse({ status: "contract_signed" }).success).toBe(true);
    expect(updateJobStatusSchema.safeParse({ status: "not_a_status" }).success).toBe(false);
    expect(updateJobStatusSchema.safeParse({}).success).toBe(false);
  });
});

describe.skipIf(!hasDatabase)("updateJobStatusCommand", () => {
  it("updates status with org scoping, soft-delete, and activity logging", async () => {
    const db = getDb();
    const stamp = Date.now();

    const [orgA] = await db
      .insert(organizations)
      .values({ name: `Status Org A ${stamp}` })
      .returning();
    const [orgB] = await db
      .insert(organizations)
      .values({ name: `Status Org B ${stamp}` })
      .returning();

    const [actor] = await db
      .insert(users)
      .values({
        organizationId: orgA.id,
        email: `status-actor-${stamp}@example.com`,
        name: "Status Actor",
      })
      .returning();

    const [customer] = await db
      .insert(customers)
      .values({
        firstName: "Pipeline",
        lastName: "Homeowner",
        email: `status-customer-${stamp}@example.com`,
      })
      .returning();

    const [property] = await db
      .insert(properties)
      .values({
        customerId: customer.id,
        addressLine1: "100 Status Lane",
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
        jobNumber: `TOP-SA-${stamp}`,
        status: "lead",
        jobType: "insurance",
      })
      .returning();

    const [jobB] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: orgB.id,
        jobNumber: `TOP-SB-${stamp}`,
        status: "lead",
        jobType: "retail",
      })
      .returning();

    const [softDeleted] = await db
      .insert(jobs)
      .values({
        propertyId: property.id,
        organizationId: orgA.id,
        jobNumber: `TOP-SD-${stamp}`,
        status: "lead",
        jobType: "insurance",
        deletedAt: new Date(),
      })
      .returning();

    const updated = await updateJobStatusCommand({
      jobId: jobA.id,
      organizationId: orgA.id,
      actorId: actor.id,
      data: { status: "inspection_scheduled" },
    });
    expect(updated.changed).toBe(true);
    expect(updated.status).toBe("inspection_scheduled");

    const [row] = await db
      .select({ status: jobs.status, updatedBy: jobs.updatedBy })
      .from(jobs)
      .where(eq(jobs.id, jobA.id));
    expect(row?.status).toBe("inspection_scheduled");
    expect(row?.updatedBy).toBe(actor.id);

    const events = await db
      .select()
      .from(activityEvents)
      .where(
        and(eq(activityEvents.jobId, jobA.id), eq(activityEvents.eventType, "job.status_changed")),
      );
    expect(events).toHaveLength(1);
    expect(events[0]?.payload).toEqual({
      from: "lead",
      to: "inspection_scheduled",
    });
    expect(events[0]?.customerId).toBe(customer.id);

    const unchanged = await updateJobStatusCommand({
      jobId: jobA.id,
      organizationId: orgA.id,
      actorId: actor.id,
      data: { status: "inspection_scheduled" },
    });
    expect(unchanged.changed).toBe(false);
    expect(unchanged.status).toBe("inspection_scheduled");

    const eventsAfterNoop = await db
      .select()
      .from(activityEvents)
      .where(
        and(eq(activityEvents.jobId, jobA.id), eq(activityEvents.eventType, "job.status_changed")),
      );
    expect(eventsAfterNoop).toHaveLength(1);

    await expect(
      updateJobStatusCommand({
        jobId: jobB.id,
        organizationId: orgA.id,
        actorId: actor.id,
        data: { status: "approved" },
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" } satisfies Partial<DomainError>);

    const [jobBAfter] = await db
      .select({ status: jobs.status })
      .from(jobs)
      .where(eq(jobs.id, jobB.id));
    expect(jobBAfter?.status).toBe("lead");

    await expect(
      updateJobStatusCommand({
        jobId: softDeleted.id,
        organizationId: orgA.id,
        actorId: actor.id,
        data: { status: "approved" },
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await db.delete(activityEvents).where(eq(activityEvents.jobId, jobA.id));
    await db.delete(jobs).where(eq(jobs.id, jobA.id));
    await db.delete(jobs).where(eq(jobs.id, jobB.id));
    await db.delete(jobs).where(eq(jobs.id, softDeleted.id));
    await db.delete(properties).where(eq(properties.id, property.id));
    await db.delete(customers).where(eq(customers.id, customer.id));
    await db.delete(users).where(eq(users.id, actor.id));
    await db.delete(organizations).where(eq(organizations.id, orgA.id));
    await db.delete(organizations).where(eq(organizations.id, orgB.id));
    await closeDb();
  });
});
