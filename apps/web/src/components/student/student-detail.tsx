"use client";

import { ScrollArea } from "@student-management-system/ui/components/scroll-area";

import { StudentEnrollment } from "./student-enrollment";
import { StudentInfo } from "./student-info";
import { StudentPayment } from "./student-payment";

type StudentDetailProps = {
  studentId: number;
};

export function StudentDetail({ studentId }: StudentDetailProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-start justify-between gap-8 border-b border-border px-8 py-6">
        <StudentInfo studentId={studentId} />
        <div className="flex max-w-md flex-col text-right">
          <h1 className="text-2xl font-bold text-foreground">Student Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your single enrolled course and split payment schedule in one
            place.
          </p>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="px-8 py-6">
          <div className="mb-6 border-b border-border">
            <span className="inline-block border-b-2 border-primary px-1 pb-2 text-sm font-medium text-primary">
              Overview
            </span>
          </div>

          <StudentEnrollment studentId={studentId} />
          <StudentPayment studentId={studentId} />
        </div>
      </ScrollArea>
    </div>
  );
}
