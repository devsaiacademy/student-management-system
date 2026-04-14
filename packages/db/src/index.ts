import { env } from "@student-management-system/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as enrollmentSchema from "./schema/enrollment";
import * as paymentSchema from "./schema/payment";
import * as razorpayOrderSchema from "./schema/razorpay-order";
import * as studentProgressSchema from "./schema/student-progress";
import * as studentSchema from "./schema/students";
import * as userProfilesSchema from "./schema/user-profiles";

const schema = {
  ...studentSchema,
  ...enrollmentSchema,
  ...paymentSchema,
  ...razorpayOrderSchema,
  ...studentProgressSchema,
  ...userProfilesSchema,
};

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool =
  globalThis._pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis._pgPool = pool;
}

export const db = drizzle(pool, { schema });
