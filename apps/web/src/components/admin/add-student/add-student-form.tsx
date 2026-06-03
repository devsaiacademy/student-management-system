"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createStudentSchema,
  type CreateStudentInput,
} from "@student-management-system/api/schemas/student";
import { Button } from "@student-management-system/ui/components/button";
import { Form } from "@student-management-system/ui/components/form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";

import { EnrollmentCard } from "./enrollment-card";
import { StudentInfoCard } from "./student-info-card";

const defaultValues: CreateStudentInput = {
  name: "",
  rollNumber: "",
  age: "" as unknown as number,
  phoneNumber: "",
  email: "",
  schoolName: "",
  standard: "",
  academicYear: "",
  motherName: "",
  motherOccupation: "",
  fatherName: "",
  fatherOccupation: "",
  reachedUsBy: "Board / Walkin",
  studentStatus: "active",
  course: "",
  duration: "3 months",
  level: "Level 1",
  closedBy: "",
  totalFees: "" as unknown as number,
  initialPayment: undefined,
  paymentPlan: "single",
  emiMonths: null,
  admissionDate: new Date(),
  joiningDate: undefined,
  kitProvided: false,
  kitCost: undefined,
};

export function AddStudentForm() {
  const router = useRouter();

  const form = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
    defaultValues,
    mode: "onBlur",
  });

  const createStudent = useMutation(
    trpc.students.createStudent.mutationOptions({
      onSuccess: (data) => {
        notify.success("The student has been added successfully");
        router.push(`/admin/all-students/student/${data.id}`);
      },
      onError: (error) => {
        notify.error(error.message);
      },
    })
  );

  const onSubmit = (values: CreateStudentInput) => {
    createStudent.mutate(values as Parameters<typeof createStudent.mutate>[0]);
  };

  const onInvalid = () => {
    notify.error("Student cannot be added, enter all the details to add");
  };

  return (
    <Form {...form}>
      <div>
        <form
          className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-6"
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        >
          <h1
            className="animate-in fade-in slide-in-from-bottom-2 px-10 text-center text-lg font-semibold text-foreground md:px-0"
            style={{ animationDuration: "400ms" }}
          >
            Enter the all the details to add new student
          </h1>

          <StudentInfoCard control={form.control} />
          <EnrollmentCard form={form} />

          <div
            className="animate-in fade-in slide-in-from-bottom-2 flex justify-end"
            style={{
              animationDelay: "180ms",
              animationDuration: "400ms",
              animationFillMode: "backwards",
            }}
          >
            <Button
              type="submit"
              variant="blue"
              size="md"
              className="rounded-[8px] px-6"
              disabled={createStudent.isPending}
            >
              {createStudent.isPending ? "Adding..." : "Add Student"}
            </Button>
          </div>
        </form>
      </div>
    </Form>
  );
}
