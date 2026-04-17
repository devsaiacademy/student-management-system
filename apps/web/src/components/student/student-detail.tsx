"use client";

import { ScrollArea } from "@student-management-system/ui/components/scroll-area";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

import { StudentEnrollment } from "./student-enrollment";
import { StudentInfo } from "./student-info";
import { StudentPayment } from "./student-payment";

type StudentDetailProps = {
  isAdmin: boolean;
  studentId: number;
};

export function StudentDetail({ isAdmin, studentId }: StudentDetailProps) {
  const { data: studentInfo } = useQuery(
    trpc.students.getStudentInfo.queryOptions({ studentId })
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-start justify-between gap-8 px-4 pt-6 pb-4 sm:px-6 md:px-10 md:pt-8 md:pb-6">
        <StudentInfo isAdmin={isAdmin} studentId={studentId} />
      </header>

      <ScrollArea className="flex-1">
        <div className="px-10 pb-10 max-md:px-4">
          <div className="border-b border-border">
            <span className="inline-block border-b-2 border-primary px-1 pb-2 text-[13px] font-medium text-primary">
              Overview
            </span>
          </div>

          <div className="mt-6">
            <StudentEnrollment
              isAdmin={isAdmin}
              academicYear={studentInfo?.academicYear}
              schoolName={studentInfo?.schoolName}
              standard={studentInfo?.standard}
              studentId={studentId}
            />
          </div>

          <div className="mt-10">
            <StudentPayment isAdmin={isAdmin} studentId={studentId} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
