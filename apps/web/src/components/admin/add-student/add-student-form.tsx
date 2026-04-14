"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createStudentSchema,
  type CreateStudentInput,
} from "@student-management-system/api/schemas/student";
import { Button } from "@student-management-system/ui/components/button";
import { Form } from "@student-management-system/ui/components/form";
import { useMutation } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

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
  enrolledMedium: "Online",
  studentSource: "Banner",
  studentStatus: "active",
  course: "Robotics",
  duration: "10 - 20 hrs",
  level: "Level 1",
  tutorName: "Mohan",
  totalFees: "" as unknown as number,
  paymentPlan: "single",
  emiMonths: null,
  startDate: new Date(),
  kitProvided: false,
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
        gooeyToast.success("Student added", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: "The student has been added successfully.",
          timing: { displayDuration: 4000 },
        });
        router.push(`/admin/all-students/student/${data.id}`);
      },
      onError: (error) => {
        gooeyToast.error("Failed to add student", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: error.message,
          timing: { displayDuration: 5000 },
        });
      },
    })
  );

  const onSubmit = (values: CreateStudentInput) => {
    createStudent.mutate(values as Parameters<typeof createStudent.mutate>[0]);
  };

  const onInvalid = () => {
    gooeyToast.error("Error adding student", {
      showTimestamp: false,
      borderColor: "#E0E0E0",
      borderWidth: 1.5,
      timing: { displayDuration: 7000 },
      description: "Student cannot be added, enter all the details to add",
    });
  };

  return (
    <Form {...form}>
      <div>
        <form
          className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-6"
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        >
          <h1
            className="animate-in fade-in slide-in-from-bottom-2 text-center text-lg font-semibold text-foreground"
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
