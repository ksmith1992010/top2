import { and, eq, isNull } from "drizzle-orm";
import { DomainError } from "@/domain/errors";
import type { UpdateJobStatusInput } from "@/domain/schemas/job";
import { getDb } from "@/lib/db";
import { activityEvents, jobs, properties } from "@/lib/db/schema";
import type { JobStatus } from "@/lib/db/schema/enums";

export type UpdateJobStatusResult = {
  id: string;
  status: JobStatus;
  updatedAt: Date;
  changed: boolean;
};

export async function updateJobStatusCommand(input: {
  jobId: string;
  organizationId: string;
  actorId: string;
  data: UpdateJobStatusInput;
}): Promise<UpdateJobStatusResult> {
  const { jobId, organizationId, actorId, data } = input;
  const db = getDb();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: jobs.id,
        status: jobs.status,
        updatedAt: jobs.updatedAt,
        propertyId: jobs.propertyId,
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.organizationId, organizationId),
          isNull(jobs.deletedAt),
        ),
      )
      .limit(1)
      .for("update");

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Job not found");
    }

    const [property] = await tx
      .select({ customerId: properties.customerId })
      .from(properties)
      .where(and(eq(properties.id, existing.propertyId), isNull(properties.deletedAt)))
      .limit(1);

    if (!property) {
      throw new DomainError("NOT_FOUND", "Job not found");
    }

    if (existing.status === data.status) {
      return {
        id: existing.id,
        status: existing.status,
        updatedAt: existing.updatedAt,
        changed: false,
      };
    }

    const now = new Date();
    const [updated] = await tx
      .update(jobs)
      .set({
        status: data.status,
        updatedBy: actorId,
        updatedAt: now,
      })
      .where(eq(jobs.id, existing.id))
      .returning({
        id: jobs.id,
        status: jobs.status,
        updatedAt: jobs.updatedAt,
      });

    await tx.insert(activityEvents).values({
      jobId: existing.id,
      customerId: property.customerId,
      actorId,
      eventType: "job.status_changed",
      subjectType: "job",
      subjectId: existing.id,
      payload: {
        from: existing.status,
        to: data.status,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt,
      changed: true,
    };
  });
}
