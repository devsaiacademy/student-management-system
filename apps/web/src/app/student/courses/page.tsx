import { CoursesManager } from "@/components/admin/courses/courses-manager";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function StudentCoursesPage() {
  const trpc = await createTRPCServerCaller();
  const courses = await trpc.courses.list();

  // Parents land here from /student. The layout already verified the
  // viewer is a student account; we hardcode `callerRole="parent"` so the
  // manager renders read-only (no add / edit / delete affordances).
  return <CoursesManager callerRole="parent" initialCourses={courses} />;
}
