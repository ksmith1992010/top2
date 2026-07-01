import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDb } from "@/lib/db";
import type * as schema from "@/lib/db/schema";

type Db = PostgresJsDatabase<typeof schema>;

/** Generate the next job number in TOP-YYYY-#### format for the current year. */
export async function generateJobNumber(db: Db = getDb()): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TOP-${year}-`;

  const result = await db.execute<{ max_num: string | null }>(sql`
    SELECT MAX(CAST(SUBSTRING(job_number FROM ${prefix.length + 1}) AS INTEGER)) AS max_num
    FROM jobs
    WHERE job_number LIKE ${`${prefix}%`}
  `);

  const maxNum = result[0]?.max_num ? Number.parseInt(result[0].max_num, 10) : 0;
  const next = maxNum + 1;

  return `${prefix}${String(next).padStart(4, "0")}`;
}
