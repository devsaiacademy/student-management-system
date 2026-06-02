import { redirect } from "next/navigation";

import { CoursesManager } from "@/components/admin/courses/courses-manager";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function CoursesPage() {
  const trpc = await createTRPCServerCaller();

  const profile = await trpc.auth.getUserProfile();
  if (!profile) {
    redirect("/login?role=parent");
  }

  const courses = await trpc.courses.list();

  return <CoursesManager callerRole={profile.role} initialCourses={courses} />;
}
