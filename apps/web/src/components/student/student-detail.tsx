"use client";

import { StudentHeader } from "./student-info";
import { EnrollmentCard, FeesCard } from "./student-overview";
import { StudentPayment } from "./student-payment";

type StudentDetailProps = {
  isAdmin: boolean;
  studentId: number;
};

// Header across the top; fees beside enrollment facts; the payment schedule
// full width underneath.
export function StudentDetail({ isAdmin, studentId }: StudentDetailProps) {
  return (
    <div className="min-h-full bg-neutral-50 px-4 pt-4 pb-10 sm:px-6 md:px-10 md:pt-8">
      <div className="flex flex-col gap-6 md:gap-8">
        <StudentHeader isAdmin={isAdmin} studentId={studentId} />
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <FeesCard studentId={studentId} />
          <EnrollmentCard isAdmin={isAdmin} studentId={studentId} />
        </div>
        <StudentPayment isAdmin={isAdmin} studentId={studentId} />
      </div>
    </div>
  );
}
