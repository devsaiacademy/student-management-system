import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "@student-management-system/env/server";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function publicTableExists(
  pool: Pool,
  tableName: string
): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName]
  );
  return result.rows[0]?.exists ?? false;
}

async function applyMigrations(pool: Pool): Promise<void> {
  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  console.log(`Schema missing — applying ${files.length} migration(s)...`);
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    // Drizzle inserts `--> statement-breakpoint` markers between statements;
    // node-postgres can execute the whole script as one simple query, so we
    // just strip the markers before sending it.
    const cleaned = sql.replaceAll("--> statement-breakpoint", "");
    await pool.query(cleaned);
    console.log(`  ✓ ${file}`);
  }
}

async function seed() {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    if (!(await publicTableExists(pool, "students"))) {
      await applyMigrations(pool);
    }

    const sqlPath = join(__dirname, "..", "seed.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    await pool.query(sql);

    // Joining-date backfill: historical enrollments and the supabase-dumped
    // seed both predate the `joining_date` column. For those rows the
    // admission day was effectively the joining day, so copy the value
    // across. Idempotent — only fills NULLs, leaves explicitly-set values
    // alone.
    await pool.query(
      `UPDATE enrollments
          SET joining_date = admission_date::date
        WHERE joining_date IS NULL`
    );

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
