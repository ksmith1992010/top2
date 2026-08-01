import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env";
import { runSeed } from "./run-seed";

async function seed() {
  const env = getServerEnv();
  const connection = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  const result = await runSeed(db, env);
  await connection.end();

  if (!result.ok) {
    throw new Error(result.message);
  }

  if (result.admin === "skipped") {
    console.log("Seed complete: organization + roles (dev admin skipped in production)");
  } else if (result.admin === "created") {
    console.log(
      `Seed complete: dev admin ${result.email} (password in docs / SEED_ADMIN_PASSWORD override)`,
    );
  } else if (result.admin === "password_reset") {
    console.log(`Seed complete: reset password for existing admin ${result.email}`);
  } else {
    console.log("Seed complete: organization + roles (dev admin already exists)");
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
