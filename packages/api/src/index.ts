import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import type { Context } from "./context";
import { isOtomatiksAdminEmail } from "./lib/admin-email";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Resolves the caller's student identity from their authenticated email.
// Admins bypass the lookup and may access any student row; non-admin
// callers must have a matching `students` row. Resolvers that receive a
// target student id must still call `assertStudentAccess` to enforce the
// comparison — this middleware only loads the identity.
export const studentProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (isOtomatiksAdminEmail(ctx.user.email)) {
      return next({
        ctx: { ...ctx, isAdmin: true, studentId: null as number | null },
      });
    }

    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.email, ctx.user.email))
      .limit(1);

    if (!student) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No student record is associated with this account",
      });
    }

    return next({
      ctx: { ...ctx, isAdmin: false, studentId: student.id as number | null },
    });
  }
);

export function assertStudentAccess(
  ctx: { isAdmin: boolean; studentId: number | null },
  targetStudentId: number
): void {
  if (ctx.isAdmin) {
    return;
  }
  if (ctx.studentId !== targetStudentId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this student's data",
    });
  }
}
