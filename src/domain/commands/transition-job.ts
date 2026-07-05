import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { activityEvents, jobs, properties } from "@/lib/db/schema";
import type { JobStatus } from "@/lib/db/schema/enums";
import { DomainError } from "@/domain/errors";
import { checkTransition } from "@/domain/job-transitions";

/**
 * The ONLY write path for jobs.status (BLUEPRINT: one status field, one
 * transition command). Validates against the state machine, requires a reason
 * for skips and backward moves, and records the change on the timeline.
 */
export async function transitionJobCommand(input: {
  jobId: string;
  organizationId: string;
  toStatus: JobStatus;
  reason?: string;
  actorId: string;
  /** Whether the actor holds jobs:transition:admin (backward moves). */
  canGoBackward: boolean;
}) {
  const { jobId, organizationId, toStatus, actorId, canGoBackward } = input;
  const reason = input.reason?.trim() || undefined;
  const db = getDb();

  return db.transaction(async (tx) => {
    const [job] = await tx
      .select({
        id: jobs.id,
        status: jobs.status,
        propertyId: jobs.propertyId,
      })
      .from(jobs)
      .where(
        and(eq(jobs.id, jobId), eq(jobs.organizationId, organizationId), isNull(jobs.deletedAt)),
      )
      .limit(1)
      .for("update");

    if (!job) {
      throw new DomainError("NOT_FOUND", "Job not found");
    }

    const fromStatus = job.status;
    const check = checkTransition(fromStatus, toStatus);

    if (!check.ok) {
      throw new DomainError("INVALID_TRANSITION", check.message);
    }

    if (check.requiresAdmin && !canGoBackward) {
      throw new DomainError(
        "ADMIN_REQUIRED",
        "Moving a job backward requires the jobs:transition:admin permission",
      );
    }

    if (check.requiresReason && !reason) {
      throw new DomainError(
        "REASON_REQUIRED",
        check.direction === "backward"
          ? "A reason is required to move a job backward"
          : "A reason is required when skipping pipeline stages",
      );
    }

    const [property] = await tx
      .select({ customerId: properties.customerId })
      .from(properties)
      .where(eq(properties.id, job.propertyId))
      .limit(1);

    const [updated] = await tx
      .update(jobs)
      .set({
        status: toStatus,
        closedAt: toStatus === "closed" ? new Date() : null,
        updatedBy: actorId,
        updatedAt: new Date(),
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
        reason: reason ?? null,
        skippedStages: check.skippedStages,
      },
    });

    return updated;
  });
}
