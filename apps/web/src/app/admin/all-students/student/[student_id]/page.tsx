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

  try {
    await trpc.students.getStudentInfo({ studentId: parsedId });
  } catch {
    notFound();
  }
  const isAdmin = await trpc.auth.isAdminUser();

  return <StudentDetail isAdmin={isAdmin} studentId={parsedId} />;
}
