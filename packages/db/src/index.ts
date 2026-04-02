import { env } from "@student-management-system/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as enrollmentSchema from "./schema/enrollment";
import * as paymentSchema from "./schema/payment";
import * as razorpayOrderSchema from "./schema/razorpay-order";
import * as studentSchema from "./schema/student";
import * as studentProgressSchema from "./schema/student-progress";

const schema = {
  ...studentSchema,
  ...enrollmentSchema,
  ...paymentSchema,
  ...razorpayOrderSchema,
  ...studentProgressSchema,
};

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema });
}

export const db = createDb();
