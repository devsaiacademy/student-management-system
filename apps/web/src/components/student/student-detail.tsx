"use client";

import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

import {
  EnrollmentDetailsCard,
  KitDetailsCard,
  PaymentProgressCard,
} from "./student-enrollment";
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
    <div className="min-h-full bg-neutral-50 px-4 pt-14 pb-10 sm:px-6 md:px-10 md:pt-8">
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_280px_280px] xl:items-stretch">
        <div className="flex flex-col gap-4 sm:gap-6 xl:col-span-1">
          <StudentInfo isAdmin={isAdmin} studentId={studentId} />
          <EnrollmentDetailsCard
            academicYear={studentInfo?.academicYear ?? undefined}
            isAdmin={isAdmin}
            schoolName={studentInfo?.schoolName ?? undefined}
            standard={studentInfo?.standard ?? undefined}
            studentId={studentId}
          />
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6 xl:contents">
          <div className="grid flex-1 basis-[280px] sm:min-h-[320px]">
            <PaymentProgressCard studentId={studentId} />
          </div>
          <div className="grid flex-1 basis-[280px] sm:min-h-[320px]">
            <KitDetailsCard studentId={studentId} />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <StudentPayment isAdmin={isAdmin} studentId={studentId} />
      </div>
    </div>
  );
}
