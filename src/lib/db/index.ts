import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";

type DbClient = ReturnType<typeof postgres>;
type Db = ReturnType<typeof drizzle<typeof schema>>;

let client: DbClient | undefined;
let db: Db | undefined;

function createClient(): DbClient {
  const { DATABASE_URL } = getServerEnv();
  return postgres(DATABASE_URL, { max: 1 });
}

export function getDb(): Db {
  if (!db) {
    client = createClient();
    db = drizzle(client, { schema });
  }
  return db;
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    const database = getDb();
    await database.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end();
    client = undefined;
    db = undefined;
  }
}
