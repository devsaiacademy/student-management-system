import { db } from "@student-management-system/db";
import {
  USER_ROLES,
  type UserRole,
} from "@student-management-system/db/schema/constants";
import { userProfiles } from "@student-management-system/db/schema/user-profiles";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, router } from "../index";
import { getSupabaseAdminClient } from "../lib/supabase-admin";

// Roles a caller is permitted to *assign* when creating or updating a user.
// Encodes two rules from the spec:
//   1. super_admin can never be created via the UI (seed-only role).
//   2. admin can only be created by super_admin (no privilege elevation).
function assignableRoles(callerRole: UserRole): readonly UserRole[] {
  if (callerRole === "super_admin") {
    return ["admin", "staff", "parent"];
  }
  return ["staff", "parent"];
}

function assertAssignable(callerRole: UserRole, target: UserRole): void {
  if (!assignableRoles(callerRole).includes(target)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your role cannot assign '${target}'`,
    });
  }
}

const createUserInput = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  name: z.string().trim().min(1).max(255),
  role: z.enum(USER_ROLES),
});

const updateUserInput = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(255).optional(),
  role: z.enum(USER_ROLES).optional(),
});

const deleteUserInput = z.object({ id: z.uuid() });

export const usersRouter = router({
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
      .orderBy(desc(userProfiles.createdAt));
    return rows;
  }),

  // Admin pre-provisions both auth.users and user_profiles in one mutation.
  // No invitation email is sent; the invitee signs in normally via magic link
  // on /login and is matched by id == auth.users.id.
  create: adminProcedure
    .input(createUserInput)
    .mutation(async ({ ctx, input }) => {
      assertAssignable(ctx.userProfile.role, input.role);

      // Reject up front if the email is already in user_profiles. Cheaper
      // than letting supabase.auth.admin.createUser fail downstream and
      // leaves no orphan auth.users rows behind.
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

      const admin = getSupabaseAdminClient();
      const { data, error } = await admin.auth.admin.createUser({
        email: input.email,
        email_confirm: true,
        user_metadata: { name: input.name },
      });

      if (error || !data.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message ?? "Failed to create auth user",
        });
      }

      try {
        const [inserted] = await db
          .insert(userProfiles)
          .values({
            id: data.user.id,
            email: input.email,
            name: input.name,
            role: input.role,
          })
          .returning();
        return inserted;
      } catch (err) {
        // Roll back the auth.users row so a failed profile insert doesn't
        // leave an orphan login. Best-effort: if cleanup also fails the
        // operator must remove the auth user manually.
        await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
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

      // Prevent demoting the last super_admin or modifying anyone's role
      // away from super_admin via this endpoint — super_admin promotions
      // and demotions are seed-only operations.
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

  // Delete = revoke access. Removes both auth.users (so they can never log
  // back in) and user_profiles. There is no soft-delete / deactivate.
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

      const admin = getSupabaseAdminClient();
      const { error } = await admin.auth.admin.deleteUser(input.id);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // auth.users → user_profiles FK is implicit (user_profiles.id == auth
      // .users.id) and not enforced as an FK, so delete the profile row too.
      await db.delete(userProfiles).where(eq(userProfiles.id, input.id));

      return { id: input.id };
    }),
});
