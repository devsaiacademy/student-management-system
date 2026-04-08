import { AdminPagination } from "@/components/admin/pagination";
import { StudentList } from "@/components/admin/student-list";
import { createTRPCServerCaller } from "@/utils/trpc-server";

type AdminPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { page: pageParam } = await searchParams;
  const parsedPage = Number(pageParam);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const trpc = await createTRPCServerCaller();

  const students = await trpc.students.getAllStudents({ page });

  return (
    <>
      <StudentList students={students} />
      <AdminPagination />
    </>
  );
}
