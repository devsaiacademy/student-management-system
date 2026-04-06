import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { env } from '@student-management-system/env/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


async function seed() {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const sqlPath = join(__dirname, '..', 'seed.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    await pool.query(sql);
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
