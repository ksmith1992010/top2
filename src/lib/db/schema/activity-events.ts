import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { jobs } from "./jobs";
import { users } from "./users";

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id").references(() => jobs.id),
    customerId: uuid("customer_id").references(() => customers.id),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    eventType: text("event_type").notNull(),
    subjectType: text("subject_type"),
    subjectId: uuid("subject_id"),
    payload: jsonb("payload").notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_activity_events_job").on(table.jobId, table.occurredAt),
    index("idx_activity_events_customer").on(table.customerId, table.occurredAt),
  ],
);

export type ActivityEvent = typeof activityEvents.$inferSelect;
export type NewActivityEvent = typeof activityEvents.$inferInsert;
