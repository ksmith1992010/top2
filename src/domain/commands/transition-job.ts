import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { activityEvents, jobs, properties } from "@/lib/db/schema";
import type { JobStatus } from "@/lib/db/schema/enums";
import { DomainError } from "@/domain/commands/create-customer";
import {
  canTransitionJob,
  requiresTransitionReason,
} from "@/domain/job-transitions";

export async function transitionJobCommand(input: {
  jobId: string;
  toStatus: JobStatus;
  reason?: string;
  actorId: string;
  organizationId: string;
}) {
  const { jobId, toStatus, reason, actorId, organizationId } = input;
  const db = getDb();

  const [job] = await db
    .select({
      id: jobs.id,
      status: jobs.status,
      organizationId: jobs.organizationId,
      propertyId: jobs.propertyId,
      jobNumber: jobs.jobNumber,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), isNull(jobs.deletedAt)))
    .limit(1);

  if (!job) {
    throw new DomainError("NOT_FOUND", "Job not found");
  }

  if (job.organizationId !== organizationId) {
    throw new DomainError("FORBIDDEN", "Job does not belong to your organization");
  }

  const fromStatus = job.status;

  if (!canTransitionJob(fromStatus, toStatus)) {
    throw new DomainError(
      "INVALID_TRANSITION",
      `Cannot transition from ${fromStatus} to ${toStatus}`,
    );
  }

  if (requiresTransitionReason(fromStatus, toStatus) && !reason?.trim()) {
    throw new DomainError("REASON_REQUIRED", "A reason is required for this transition");
  }

  const [property] = await db
    .select({ customerId: properties.customerId })
    .from(properties)
    .where(eq(properties.id, job.propertyId))
    .limit(1);

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(jobs)
      .set({
        status: toStatus,
        updatedBy: actorId,
        updatedAt: new Date(),
        closedAt: toStatus === "closed" || toStatus === "lost" ? new Date() : null,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    await tx.insert(activityEvents).values({
      jobId: job.id,
      customerId: property?.customerId ?? null,
      actorId,
      eventType: "job.status_changed",
      subjectType: "job",
      subjectId: job.id,
      payload: {
        from: fromStatus,
        to: toStatus,
        reason: reason?.trim() || null,
        jobNumber: job.jobNumber,
      },
    });

    return updated;
  });
}
