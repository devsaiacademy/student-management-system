import { env } from "@student-management-system/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema/student";

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema });
}

export const db = createDb();
