import { env } from "@student-management-system/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

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

export function createDb() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  return drizzle(env.DATABASE_URL, { schema });
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    const instance = createDb();
    return Reflect.get(instance, prop);
  },
});
