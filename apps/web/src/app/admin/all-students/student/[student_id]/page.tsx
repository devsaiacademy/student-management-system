import { StudentDetail } from "@/components/student/student-detail";
import { createTRPCServerCaller } from "@/utils/trpc-server";
import { notFound } from "next/navigation";

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
    await trpc.billing.getStudentInfo({ studentId: parsedId });
  } catch {
    notFound();
  }

  return <StudentDetail studentId={parsedId} />;
}