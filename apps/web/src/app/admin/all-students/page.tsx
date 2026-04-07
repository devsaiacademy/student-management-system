"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Pagination } from "@/components/admin/pagination";
import { StudentList } from "@/components/admin/student-list";
import { trpc } from "@/utils/trpc";

const PAGE_SIZE = 10;

export default function AdminPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isPending } = useQuery(
    trpc.students.list.queryOptions({
      limit: PAGE_SIZE,
      offset: (currentPage - 1) * PAGE_SIZE,
    })
  );

  // TODO: replace with a real total count from the server
  // (students.list currently returns rows only — add a count query or
  // change the procedure to return { rows, total } when you're ready).
  const totalPages = 1;

  return (
    <>
      <StudentList isLoading={isPending} students={data ?? []} />
      <Pagination
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        totalPages={totalPages}
      />
    </>
  );
}
