import { publicProcedure, router } from "../index";
import { authRouter } from "./auth";
import { enrollmentRouter } from "./enrollment";
import { paymentsRouter } from "./payment";
import { razorpayRouter } from "./razorpay";
import { reportsRouter } from "./reports";
import { studentsRouter } from "./students";

export const appRouter = router({
  auth: authRouter,
  students: studentsRouter,
  enrollments: enrollmentRouter,
  payments: paymentsRouter,
  razorpay: razorpayRouter,
  reports: reportsRouter,
  healthCheck: publicProcedure.query(() => "OK"),
});

export type AppRouter = typeof appRouter;
