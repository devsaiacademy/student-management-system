import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { env } from "@student-management-system/env/server";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function buildResetSql(): string {
  return `
    TRUNCATE public.user_profiles, students, enrollments, student_progress, razorpay_orders, payments RESTART IDENTITY CASCADE;
    DELETE FROM auth.users CASCADE;
  `;
}

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

async function columnExists(
  pool: Pool,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     ) AS exists`,
    [tableName, columnName]
  );
  return result.rows[0]?.exists ?? false;
}

async function getAppliedMigrationHashes(pool: Pool): Promise<Set<string>> {
  const existsResult = await pool.query<{ exists: boolean }>(
    `SELECT to_regclass('drizzle.__drizzle_migrations') AS exists`
  );

  if (!existsResult.rows[0]?.exists) {
    return new Set();
  }

  const result = await pool.query<{ hash: string }>(
    `SELECT hash FROM drizzle.__drizzle_migrations`
  );

  return new Set(result.rows.map((row) => row.hash));
}

async function applyMigrations(pool: Pool): Promise<void> {
  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const appliedHashes = await getAppliedMigrationHashes(pool);
  const pending = [] as Array<{ file: string; sql: string }>;

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    const cleaned = sql.replaceAll("--> statement-breakpoint", "");
    const hash = createHash("sha256").update(cleaned).digest("hex");

    if (!appliedHashes.has(hash)) {
      pending.push({ file, sql: cleaned });
    }
  }

  if (pending.length === 0) {
    return;
  }

  console.log(`Schema missing or drifted — applying ${pending.length} migration(s)...`);
  for (const { file, sql } of pending) {
    await pool.query(sql);
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
    const tableExists = await publicTableExists(pool, "students");
    const hasJoiningDate = await columnExists(pool, "enrollments", "joining_date");

    if (!tableExists || !hasJoiningDate) {
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

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  void seed();
}
