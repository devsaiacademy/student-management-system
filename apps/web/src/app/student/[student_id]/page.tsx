import { logger } from "@student-management-system/api/lib/logger";
import { notFound } from "next/navigation";

import { StudentDetail } from "@/components/student/student-detail";
import { createTRPCServerCaller } from "@/utils/trpc-server";

type StudentPageProps = {
  params: Promise<{ student_id: string }>;
};

export default async function StudentPage({ params }: StudentPageProps) {
  const { student_id } = await params;
  const parsedId = Number(student_id);
  if (!Number.isFinite(parsedId) || parsedId < 1) {
    notFound();
  }

  const trpc = await createTRPCServerCaller();
  let exists = false;
  try {
    await trpc.students.getStudentInfo({ studentId: parsedId });
    exists = true;
  } catch (error) {
    // NOT_FOUND / FORBIDDEN / transient — treat as "no such page", but log
    // why so a 404 seen by a signed-in parent can be traced.
    logger.warn("student page: getStudentInfo failed, rendering 404", {
      studentId: parsedId,
      error,
    });
  }

  if (!exists) {
    notFound();
  }

  return <StudentDetail isAdmin={false} studentId={parsedId} />;
}
