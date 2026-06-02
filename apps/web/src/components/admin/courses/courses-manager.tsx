"use client";

import type { UserRole } from "@student-management-system/db/schema/constants";
import { Button } from "@student-management-system/ui/components/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

import { CourseCard } from "./course-card";
import { CourseFormDialog } from "./course-form-dialog";
import { DeleteCourseDialog } from "./delete-course-dialog";

type Course = {
  id: number;
  name: string;
  description: string;
};

type CoursesManagerProps = {
  callerRole: UserRole;
  initialCourses: Course[];
};

export function CoursesManager({
  callerRole,
  initialCourses,
}: CoursesManagerProps) {
  const queryClient = useQueryClient();
  // Only admin and super_admin can mutate courses. Staff (and any other
  // role that reaches this page) see a read-only list. The tRPC procedures
  // re-check the role server-side, so this is purely UX.
  const canManage = callerRole === "admin" || callerRole === "super_admin";

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);

  const coursesQuery = useQuery({
    ...trpc.courses.list.queryOptions(),
    initialData: initialCourses,
  });
  const courses = coursesQuery.data ?? initialCourses;

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.courses.list.queryOptions().queryKey,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-col items-center gap-3 px-6 py-5 max-[480px]:items-center min-[481px]:grid min-[481px]:grid-cols-[1fr_auto_1fr] min-[481px]:items-start min-[481px]:gap-4">
        <div className="hidden min-[481px]:block" />
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-lg font-semibold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Manage the courses students can enroll in"
              : "Courses students can enroll in"}
          </p>
        </div>
        <div className="flex justify-center min-[481px]:justify-end">
          {canManage ? (
            <Button
              className="h-10 rounded-[8px] px-4 text-sm"
              onClick={() => setAdding(true)}
              type="button"
            >
              <Plus aria-hidden className="size-4" />
              Add Course
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {courses.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            {canManage ? (
              <>
                No courses yet. Click{" "}
                <strong className="mx-1">+ Add Course</strong> to add one.
              </>
            ) : (
              "No courses available yet."
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <CourseCard
                canManage={canManage}
                course={course}
                index={index}
                key={course.id}
                onDelete={() => setDeleting(course)}
                onEdit={() => setEditing(course)}
              />
            ))}
          </div>
        )}
      </div>

      <CourseFormDialog
        mode="create"
        onOpenChange={setAdding}
        onSuccess={() => {
          setAdding(false);
          invalidate();
        }}
        open={adding}
      />

      {editing ? (
        <CourseFormDialog
          initialValues={editing}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) {
              setEditing(null);
            }
          }}
          onSuccess={() => {
            setEditing(null);
            invalidate();
          }}
          open={editing !== null}
        />
      ) : null}

      <DeleteCourseDialog
        course={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        onSuccess={() => {
          setDeleting(null);
          invalidate();
        }}
        open={deleting !== null}
      />
    </div>
  );
}
