import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { formatActivitySummary } from "@/lib/activity-labels";
import { getDb } from "@/lib/db";
import { activityEvents, jobs, properties, users } from "@/lib/db/schema";

export const DEFAULT_JOB_ACTIVITY_LIMIT = 50;
export const MAX_JOB_ACTIVITY_LIMIT = 100;

export type JobActivityItem = {
  id: string;
  eventType: string;
  summary: string;
  occurredAt: Date;
  actorName: string | null;
};

export type ListJobActivityInput = {
  jobId: string;
  organizationId: string;
  limit?: number;
};

export type ListJobActivityResult = {
  items: JobActivityItem[];
  total: number;
  limit: number;
};

/**
 * Org-scoped job timeline. Job-linked events only (`activity_events.job_id`).
 * Customer-level (`jobId` null) events are deferred until activity has explicit org scoping.
 */
export async function listJobActivity(
  input: ListJobActivityInput,
): Promise<ListJobActivityResult | null> {
  const db = getDb();
  const limit = Math.min(
    Math.max(input.limit ?? DEFAULT_JOB_ACTIVITY_LIMIT, 1),
    MAX_JOB_ACTIVITY_LIMIT,
  );

  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .innerJoin(properties, eq(properties.id, jobs.propertyId))
    .where(
      and(
        eq(jobs.id, input.jobId),
        eq(jobs.organizationId, input.organizationId),
        isNull(jobs.deletedAt),
        isNull(properties.deletedAt),
      ),
    )
    .limit(1);

  if (!job) {
    return null;
  }

  const scope = eq(activityEvents.jobId, job.id);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activityEvents)
    .where(scope);

  const rows = await db
    .select({
      id: activityEvents.id,
      eventType: activityEvents.eventType,
      payload: activityEvents.payload,
      occurredAt: activityEvents.occurredAt,
      actorName: users.name,
    })
    .from(activityEvents)
    .leftJoin(users, eq(users.id, activityEvents.actorId))
    .where(scope)
    .orderBy(desc(activityEvents.occurredAt))
    .limit(limit);

  return {
    items: rows.map((row) => ({
      id: row.id,
      eventType: row.eventType,
      summary: formatActivitySummary(row.eventType, row.payload),
      occurredAt: row.occurredAt,
      actorName: row.actorName,
    })),
    total: countRow?.count ?? 0,
    limit,
  };
}
