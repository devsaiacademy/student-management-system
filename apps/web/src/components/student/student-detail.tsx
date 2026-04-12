"use client";

import { ScrollArea } from "@student-management-system/ui/components/scroll-area";

import { StudentEnrollment } from "./student-enrollment";
import { StudentInfo } from "./student-info";
import { StudentPayment } from "./student-payment";

type StudentDetailProps = {
  isAdmin:boolean,
  studentId: number;
};

export function StudentDetail({ isAdmin, studentId }: StudentDetailProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-scroll bg-background">
      <header className="flex items-start justify-between gap-8 px-10 pt-8 pb-6">
        <StudentInfo isAdmin={isAdmin} studentId={studentId} />
        <div className="flex max-w-md flex-col">
          <h1 className="text-[22px] font-semibold leading-tight text-foreground">
            Student Billing
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Track your single enrolled course and split payment schedule in one
            place.
          </p>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="px-10 pb-10">
          <div className="border-b border-border">
            <span className="inline-block border-b-2 border-primary px-1 pb-2 text-[13px] font-medium text-primary">
              Overview
            </span>
          </div>

          <div className="mt-6">
            <StudentEnrollment studentId={studentId} />
          </div>

          <div className="mt-10">
            <StudentPayment studentId={studentId} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
