import { db } from "@student-management-system/db";
import {
  type UserRole,
} from "@student-management-system/db/schema/constants";
import { userProfiles } from "@student-management-system/db/schema/user-profiles";
import { TRPCError } from "@trpc/server";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, router, staffProcedure } from "../index";

// Roles considered "workers" — the only ones this admin page manages.
// Parents are end-customers, provisioned implicitly by the parent-login
// trigger; they never show up here.
const WORKER_ROLES = ["staff", "admin", "super_admin"] as const satisfies readonly UserRole[];

// Roles a caller is permitted to *assign* when creating or updating a
// worker. super_admin is seed-only; admin can only be created by
// super_admin.
function assignableRoles(callerRole: UserRole): readonly UserRole[] {
  if (callerRole === "super_admin") {
    return ["admin", "staff"];
  }
  return ["staff"];
}

function assertAssignable(callerRole: UserRole, target: UserRole): void {
  if (!assignableRoles(callerRole).includes(target)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your role cannot assign '${target}'`,
    });
  }
}

// Inputs are scoped to worker roles so callers can't slip "parent" through.
const workerRoleEnum = z.enum(["admin", "staff"]);

const createUserInput = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  name: z.string().trim().min(1).max(255),
  role: workerRoleEnum,
});

const updateUserInput = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(255).optional(),
  role: workerRoleEnum.optional(),
});

const deleteUserInput = z.object({ id: z.uuid() });

export const usersRouter = router({
  // Lightweight name list of every worker (admin / super_admin / staff),
  // used by add-student "Closed By" dropdown. Available to anyone who can
  // create students (staff and above), unlike `list` which is admin-only.
  staffs: staffProcedure.query(async () => {
    const rows = await db
      .select({
        id: userProfiles.id,
        name: userProfiles.name,
        role: userProfiles.role,
      })
      .from(userProfiles)
      .where(inArray(userProfiles.role, WORKER_ROLES))
      .orderBy(userProfiles.name);
    return rows;
  }),

  list: adminProcedure.query(async () => {
    const rows = await db
      .select({
        id: userProfiles.id,
        email: userProfiles.email,
        name: userProfiles.name,
        role: userProfiles.role,
        createdAt: userProfiles.createdAt,
      })
      .from(userProfiles)
      .where(inArray(userProfiles.role, WORKER_ROLES))
      .orderBy(desc(userProfiles.createdAt));
    return rows;
  }),

  // Insert a stub user_profiles row with a placeholder uuid. We do NOT touch
  // auth.users here — when the invitee later signs in via magic link from
  // /login, Supabase creates the auth.users row and the handle_new_user
  // trigger reattaches this profile by email (UPDATEs the id to the real
  // auth.users.id). This sidesteps the service-role-key dependency entirely.
  create: adminProcedure
    .input(createUserInput)
    .mutation(async ({ ctx, input }) => {
      assertAssignable(ctx.userProfile.role, input.role);

      const existing = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.email, input.email),
        columns: { id: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }

      try {
        const [inserted] = await db
          .insert(userProfiles)
          .values({
            id: sql`gen_random_uuid()`,
            email: input.email,
            name: input.name,
            role: input.role,
          })
          .returning();
        return inserted;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to insert user_profile",
        });
      }
    }),

  update: adminProcedure
    .input(updateUserInput)
    .mutation(async ({ ctx, input }) => {
      if (input.role) {
        assertAssignable(ctx.userProfile.role, input.role);
      }

      // super_admin promotions/demotions are seed-only operations — never
      // exposed through the UI.
      const target = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.id, input.id),
        columns: { role: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      if (target.role === "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "super_admin rows are managed manually",
        });
      }

      const patch: { name?: string; role?: UserRole } = {};
      if (input.name !== undefined) {
        patch.name = input.name;
      }
      if (input.role !== undefined) {
        patch.role = input.role;
      }

      if (Object.keys(patch).length === 0) {
        return target;
      }

      const [updated] = await db
        .update(userProfiles)
        .set(patch)
        .where(eq(userProfiles.id, input.id))
        .returning();
      return updated;
    }),

  // Delete = revoke access. Removes auth.users (if the user has ever
  // logged in) AND user_profiles. Uses direct SQL on auth.users — no
  // Supabase Auth admin API call, so this works regardless of the
  // service-role key configuration.
  delete: adminProcedure
    .input(deleteUserInput)
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account",
        });
      }

      const target = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.id, input.id),
        columns: { role: true, email: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      if (target.role === "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "super_admin rows are managed manually",
        });
      }

      await db.transaction(async (tx) => {
        // Remove the auth.users row matching this profile's id, AND any
        // auth.users row matching the email (covers stub profiles whose
        // id is still a placeholder uuid because the user hasn't logged
        // in yet). Both queries use the postgres role from DATABASE_URL.
        await tx.execute(
          sql`DELETE FROM auth.users WHERE id = ${input.id} OR LOWER(email) = ${target.email.toLowerCase()}`
        );
        await tx.delete(userProfiles).where(eq(userProfiles.id, input.id));
      });

      return { id: input.id };
    }),
});
