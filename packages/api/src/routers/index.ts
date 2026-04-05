import { publicProcedure, router } from "../index";
import { authRouter } from "./auth";

export const appRouter = router({
  auth: authRouter,
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
});
export type AppRouter = typeof appRouter;
