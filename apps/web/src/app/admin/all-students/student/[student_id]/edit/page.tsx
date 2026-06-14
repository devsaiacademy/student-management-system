import type { CreateStudentInput } from "@student-management-system/api/schemas/student";
import { notFound } from "next/navigation";

import { AddStudentForm } from "@/components/admin/add-student/add-student-form";
import { createTRPCServerCaller } from "@/utils/trpc-server";

type EditStudentPageProps = {
  params: Promise<{ student_id: string }>;
};

export default async function EditStudentPage({
  params,
}: EditStudentPageProps) {
  const { student_id } = await params;

  const parsedId = Number(student_id);

  if (!Number.isFinite(parsedId) || parsedId < 1) {
    notFound();
  }

  const trpc = await createTRPCServerCaller();

  // Editing is admin-only; parents reaching this route get a 404.
  const isAdmin = await trpc.auth.isAdminUser();
  if (!isAdmin) {
    notFound();
  }

  const data = await trpc.students
    .getStudentForEdit({ id: parsedId })
    .catch(() => null);

  if (!data) {
    notFound();
  }

  const { id, ...initialValues } = data;

  return (
    <AddStudentForm
      initialValues={initialValues as CreateStudentInput}
      mode="edit"
      studentId={id}
    />
  );
}
