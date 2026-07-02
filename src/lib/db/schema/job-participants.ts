import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { jobParticipantRoleEnum } from "./enums";
import { jobs } from "./jobs";
import { users } from "./users";

export const jobParticipants = pgTable(
  "job_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: jobParticipantRoleEnum("role").notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    assignedBy: uuid("assigned_by").references(() => users.id),
    removedAt: timestamp("removed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_job_participants_job").on(table.jobId),
    index("idx_job_participants_user").on(table.userId),
  ],
);

export type JobParticipant = typeof jobParticipants.$inferSelect;
export type NewJobParticipant = typeof jobParticipants.$inferInsert;
