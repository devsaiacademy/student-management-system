import { db } from "@student-management-system/db";
import { students } from "@student-management-system/db/schema/students";
import { initTRPC, TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";

import type { Context, UserProfile } from "./context";
import { logger } from "./lib/logger";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

// Logs every failed procedure call, whether it came over HTTP or through the
// server-side caller (Server Components swallow errors into 404s/redirects,
// so this is the only trace of why). Expected client errors are `warn`,
// unexpected ones `error`. Successful calls are not logged.
const loggedProcedure = t.procedure.use(async ({ ctx, path, type, next }) => {
  const startedAt = Date.now();
  const result = await next();
  if (!result.ok) {
    const { error } = result;
    const level = error.code === "INTERNAL_SERVER_ERROR" ? "error" : "warn";
    logger[level]("trpc procedure failed", {
      path,
      type,
      code: error.code,
      durationMs: Date.now() - startedAt,
      userId: ctx.user?.id ?? null,
      error: error.cause ?? error,
    });
  }
  return result;
});

export const publicProcedure = loggedProcedure;

// Authenticated session, profile may or may not exist (defensive — explicit
// provisioning means a logged-in user without a profile is an error state).
export const protectedProcedure = loggedProcedure.use(({ ctx, next }) => {
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
//
// Parents are authorized by email match alone, not by a user_profiles row:
// the handle_new_user trigger only provisions a parent profile when the
// students row already exists at sign-up time, so a parent whose auth user
// predates their student row has no profile. The /student layout already
// gates on the same email match. One parent email can belong to several
// students (siblings), so every matching id is allowed.
export const studentProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const role = ctx.userProfile?.role;

    if (role === "staff" || role === "admin" || role === "super_admin") {
      return next({
        ctx: {
          ...ctx,
          isAdmin: true,
          studentIds: [] as number[],
        },
      });
    }

    const rows = await db
      .select({ id: students.id })
      .from(students)
      .where(sql`lower(${students.email}) = lower(${ctx.user.email})`);

    if (rows.length === 0) {
      logger.warn("studentProcedure: no student matches session email", {
        userId: ctx.user.id,
        hasProfile: Boolean(ctx.userProfile),
        role: role ?? null,
      });
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No student record is associated with this account",
      });
    }

    if (!ctx.userProfile) {
      logger.warn("studentProcedure: parent has no user_profiles row", {
        userId: ctx.user.id,
        studentIds: rows.map((row) => row.id),
      });
    }

    return next({
      ctx: {
        ...ctx,
        isAdmin: false,
        studentIds: rows.map((row) => row.id),
      },
    });
  }
);

export function assertStudentAccess(
  ctx: { isAdmin: boolean; studentIds: number[] },
  targetStudentId: number
): void {
  if (ctx.isAdmin) {
    return;
  }
  if (!ctx.studentIds.includes(targetStudentId)) {
    logger.warn("assertStudentAccess: student not linked to session", {
      targetStudentId,
      allowedStudentIds: ctx.studentIds,
    });
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this student's data",
    });
  }
}
