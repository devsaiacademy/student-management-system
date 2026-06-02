import { db } from "@student-management-system/db";
import { courses } from "@student-management-system/db/schema/courses";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import z from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";
import { courseInputSchema } from "../schemas/course";

const idSchema = z.object({ id: z.number().int().positive() });

function translateUniqueViolation(error: unknown): never {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("courses_name_unique")) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A course with this name already exists",
    });
  }
  if (error instanceof TRPCError) {
    throw error;
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: message || "Failed to save course",
    cause: error,
  });
}

export const coursesRouter = router({
  list: protectedProcedure.query(async () => {
    return db
      .select({
        id: courses.id,
        name: courses.name,
        description: courses.description,
      })
      .from(courses)
      .orderBy(asc(courses.name));
  }),

  create: adminProcedure
    .input(courseInputSchema)
    .mutation(async ({ input }) => {
      try {
        const [inserted] = await db
          .insert(courses)
          .values({ name: input.name, description: input.description })
          .returning();
        return inserted;
      } catch (error) {
        translateUniqueViolation(error);
      }
    }),

  update: adminProcedure
    .input(idSchema.extend(courseInputSchema.shape))
    .mutation(async ({ input }) => {
      try {
        const [updated] = await db
          .update(courses)
          .set({ name: input.name, description: input.description })
          .where(eq(courses.id, input.id))
          .returning();
        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Course not found",
          });
        }
        return updated;
      } catch (error) {
        translateUniqueViolation(error);
      }
    }),

  delete: adminProcedure.input(idSchema).mutation(async ({ input }) => {
    const [deleted] = await db
      .delete(courses)
      .where(eq(courses.id, input.id))
      .returning({ id: courses.id });
    if (!deleted) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
    }
    return deleted;
  }),
});
