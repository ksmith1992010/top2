import { date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { jobStatusEnum, jobTypeEnum } from "./enums";
import { organizations } from "./organizations";
import { properties } from "./properties";
import { users } from "./users";

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    jobNumber: text("job_number").notNull().unique(),
    status: jobStatusEnum("status").notNull().default("lead"),
    jobType: jobTypeEnum("job_type").notNull().default("insurance"),
    leadSource: text("lead_source"),
    stormDate: date("storm_date"),
    notes: text("notes"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_jobs_org_status").on(table.organizationId, table.status),
    index("idx_jobs_property").on(table.propertyId),
    index("idx_jobs_created").on(table.createdAt),
    index("idx_jobs_number").on(table.jobNumber),
  ],
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
