"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createStudentSchema,
  type CreateStudentInput,
  editStudentFormSchema,
} from "@student-management-system/api/schemas/student";
import { Button } from "@student-management-system/ui/components/button";
import { Form } from "@student-management-system/ui/components/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";

import { EnrollmentCard } from "./enrollment-card";
import { generateRandomStudentInfo } from "./random-student";
import { StudentInfoCard } from "./student-info-card";

const IS_DEV = process.env.NODE_ENV === "development";

function getSubmitLabel(isEdit: boolean, isPending: boolean): string {
  if (isEdit) {
    return isPending ? "Saving..." : "Save Changes";
  }
  return isPending ? "Adding..." : "Add Student";
}

const defaultValues: CreateStudentInput = {
  name: "",
  rollNumber: "",
  age: "" as unknown as number,
  dob: undefined,
  phoneNumber: "",
  phoneNumber2: "",
  email: "",
  address: "",
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

type AddStudentFormProps = {
  mode?: "create" | "edit";
  studentId?: number;
  initialValues?: CreateStudentInput;
  // On edit, true when a payment has been recorded — the fee fields are
  // disabled because the schedule can no longer be rebuilt.
  feesLocked?: boolean;
};

export function AddStudentForm({
  mode = "create",
  studentId,
  initialValues,
  feesLocked = false,
}: AddStudentFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = mode === "edit";

  const form = useForm<CreateStudentInput>({
    // Edit mode relaxes the mandatory-address rule so legacy students with no
    // address aren't blocked from other edits; add mode keeps it required.
    resolver: zodResolver(isEdit ? editStudentFormSchema : createStudentSchema),
    defaultValues: initialValues ?? defaultValues,
    mode: "onBlur",
  });

  const createStudent = useMutation(
    trpc.students.createStudent.mutationOptions({
      onSuccess: (data) => {
        notify.success("The student has been added successfully");
        // Refresh the count, search and filter lists so the new student shows.
        queryClient.invalidateQueries({ queryKey: trpc.students.pathKey() });
        router.push(`/admin/all-students/student/${data.id}`);
      },
      onError: (error) => {
        notify.error(error.message);
      },
    })
  );

  const updateStudent = useMutation(
    trpc.students.updateStudent.mutationOptions({
      onSuccess: (data) => {
        notify.success("The student details have been updated");
        // The detail page caches these per-student queries; invalidate so it
        // shows the edited values (and any rebuilt schedule) on return.
        for (const queryKey of [
          // Covers getStudentInfo plus the search/filter lists (name, status).
          trpc.students.pathKey(),
          trpc.enrollments.getStudentEnrollment.queryOptions({
            studentId: data.id,
          }).queryKey,
          trpc.payments.getStudentPayments.queryOptions({ studentId: data.id })
            .queryKey,
        ]) {
          queryClient.invalidateQueries({ queryKey });
        }
        router.push(`/admin/all-students/student/${data.id}`);
      },
      onError: (error) => {
        notify.error(error.message);
      },
    })
  );

  const isPending = isEdit ? updateStudent.isPending : createStudent.isPending;

  const onSubmit = (values: CreateStudentInput) => {
    if (isEdit && studentId != null) {
      updateStudent.mutate({ id: studentId, ...values } as Parameters<
        typeof updateStudent.mutate
      >[0]);
      return;
    }
    createStudent.mutate(values as Parameters<typeof createStudent.mutate>[0]);
  };

  const onInvalid = () => {
    notify.error(
      isEdit
        ? "Student cannot be updated, fix the highlighted fields"
        : "Student cannot be added, enter all the details to add"
    );
  };

  // Dev-only: fill the Student Information fields with random valid data,
  // preserving any enrollment/payment values already entered.
  const fillRandomStudent = () => {
    form.reset({ ...form.getValues(), ...generateRandomStudentInfo() });
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
            {isEdit
              ? "Edit the student details"
              : "Enter the all the details to add new student"}
          </h1>

          <StudentInfoCard control={form.control} mode={mode} />
          <EnrollmentCard feesLocked={feesLocked} form={form} mode={mode} />

          <div
            className="animate-in fade-in slide-in-from-bottom-2 flex justify-end gap-3"
            style={{
              animationDelay: "180ms",
              animationDuration: "400ms",
              animationFillMode: "backwards",
            }}
          >
            {IS_DEV && !isEdit && (
              <Button
                type="button"
                variant="white"
                size="md"
                className="rounded-[8px] px-6"
                onClick={fillRandomStudent}
              >
                Generate Random
              </Button>
            )}
            <Button
              type="submit"
              variant="blue"
              size="md"
              className="rounded-[8px] px-6"
              disabled={isPending}
            >
              {getSubmitLabel(isEdit, isPending)}
            </Button>
          </div>
        </form>
      </div>
    </Form>
  );
}
