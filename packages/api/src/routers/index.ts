import { publicProcedure, router } from "../index";
import { authRouter } from "./auth";
import { billingRouter } from "./billing";
import { studentsRouter } from "./students";

export const appRouter = router({
  auth: authRouter,
  billing: billingRouter,
  students: studentsRouter,
  healthCheck: publicProcedure.query(() => "OK"),
});

export type AppRouter = typeof appRouter;
