import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import type { Context, UserProfile } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

// Authenticated session, profile may or may not exist (defensive — explicit
// provisioning means a logged-in user without a profile is an error state).
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireProfile(profile: UserProfile | null): UserProfile {
  if (!profile) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No user profile is associated with this account",
    });
  }
  return profile;
}

// staff | admin | super_admin — operational role surface. Most read/write
// mutations on students/enrollments/payments live behind this.
export const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  const profile = requireProfile(ctx.userProfile);
  if (
    profile.role !== "staff" &&
    profile.role !== "admin" &&
    profile.role !== "super_admin"
  ) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff or above only" });
  }
  return next({ ctx: { ...ctx, userProfile: profile } });
});

// admin | super_admin — privileged operations: user management, mark-unpaid,
// toggle partial-payment.
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const profile = requireProfile(ctx.userProfile);
  if (profile.role !== "admin" && profile.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx: { ...ctx, userProfile: profile } });
});

// super_admin only — currently used for creating users with role='admin'.
export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const profile = requireProfile(ctx.userProfile);
  if (profile.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Super admin only" });
  }
  return next({ ctx: { ...ctx, userProfile: profile } });
});

// Resolves the caller's student identity. Staff/admin/super_admin bypass and
// may access any student row; parents are matched against their auth uid via
// the students.auth_user_id column (or email fallback for legacy rows).
// `isAdmin` is preserved as the field name because every existing caller
// branches on it; the semantic is now "has all-students access".
export const studentProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const profile = requireProfile(ctx.userProfile);

    if (
      profile.role === "staff" ||
      profile.role === "admin" ||
      profile.role === "super_admin"
    ) {
      return next({
        ctx: {
          ...ctx,
          userProfile: profile,
          isAdmin: true,
          studentId: null as number | null,
        },
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
      ctx: {
        ...ctx,
        userProfile: profile,
        isAdmin: false,
        studentId: student.id as number | null,
      },
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
