import { StudentList } from "@/components/admin/student-list";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function AdminPage() {
  const trpc = await createTRPCServerCaller();
  const students = await trpc.students.list();

  return <StudentList students={students} />;
}
