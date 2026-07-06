import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { activityEvents, users } from "@/lib/db/schema";

export type ActivityItem = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  actorName: string;
};

const MAX_EVENTS = 100;

/** Timeline for one job, newest first. Caller is responsible for org scoping. */
export async function listJobActivity(jobId: string, limit = 50): Promise<ActivityItem[]> {
  const db = getDb();
  return db
    .select({
      id: activityEvents.id,
      eventType: activityEvents.eventType,
      payload: activityEvents.payload,
      occurredAt: activityEvents.occurredAt,
      actorName: users.name,
    })
    .from(activityEvents)
    .innerJoin(users, eq(users.id, activityEvents.actorId))
    .where(eq(activityEvents.jobId, jobId))
    .orderBy(desc(activityEvents.occurredAt))
    .limit(Math.min(limit, MAX_EVENTS)) as Promise<ActivityItem[]>;
}

/** Timeline for one customer, newest first. Caller is responsible for org scoping. */
export async function listCustomerActivity(
  customerId: string,
  limit = 50,
): Promise<ActivityItem[]> {
  const db = getDb();
  return db
    .select({
      id: activityEvents.id,
      eventType: activityEvents.eventType,
      payload: activityEvents.payload,
      occurredAt: activityEvents.occurredAt,
      actorName: users.name,
    })
    .from(activityEvents)
    .innerJoin(users, eq(users.id, activityEvents.actorId))
    .where(eq(activityEvents.customerId, customerId))
    .orderBy(desc(activityEvents.occurredAt))
    .limit(Math.min(limit, MAX_EVENTS)) as Promise<ActivityItem[]>;
}
