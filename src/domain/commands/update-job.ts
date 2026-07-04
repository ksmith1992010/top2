import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { activityEvents, jobs } from "@/lib/db/schema";
import type { UpdateJobInput } from "@/domain/schemas/job";
import { DomainError } from "@/domain/errors";

/**
 * Update non-status job fields (notes, lead source, storm date, job type).
 * Status never changes here — that is TransitionJobCommand's job (PR-006).
 */
export async function updateJobCommand(input: {
  jobId: string;
  organizationId: string;
  data: UpdateJobInput;
  actorId: string;
}) {
  const { jobId, organizationId, data, actorId } = input;
  const db = getDb();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: jobs.id })
      .from(jobs)
      .where(
        and(eq(jobs.id, jobId), eq(jobs.organizationId, organizationId), isNull(jobs.deletedAt)),
      )
      .limit(1)
      .for("update");

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Job not found");
    }

    const updates: Partial<typeof jobs.$inferInsert> = {
      updatedBy: actorId,
      updatedAt: new Date(),
    };

    const changed: string[] = [];
    if (data.notes !== undefined) {
      updates.notes = data.notes.trim() || null;
      changed.push("notes");
    }
    if (data.leadSource !== undefined) {
      updates.leadSource = data.leadSource.trim() || null;
      changed.push("leadSource");
    }
    if (data.stormDate !== undefined) {
      updates.stormDate = data.stormDate;
      changed.push("stormDate");
    }
    if (data.jobType !== undefined) {
      updates.jobType = data.jobType;
      changed.push("jobType");
    }

    const [job] = await tx.update(jobs).set(updates).where(eq(jobs.id, jobId)).returning();

    await tx.insert(activityEvents).values({
      jobId: job.id,
      actorId,
      eventType: "job.updated",
      subjectType: "job",
      subjectId: job.id,
      payload: { fields: changed },
    });

    return job;
  });
}
