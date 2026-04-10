"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createStudentSchema,
  type CreateStudentInput,
} from "@student-management-system/api/schemas/student";
import {
  COURSES,
  DURATIONS,
  EMI_MONTHS_OPTIONS,
  ENROLLED_MEDIUMS,
  LEVELS,
  STUDENT_SOURCES,
  STUDENT_STATUSES,
  TUTOR_NAMES,
} from "@student-management-system/db/schema/constants";
import { Button } from "@student-management-system/ui/components/button";
import { Calendar } from "@student-management-system/ui/components/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@student-management-system/ui/components/form";
import { Input } from "@student-management-system/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@student-management-system/ui/components/popover";
import {
  RadioGroup,
  RadioGroupItem,
} from "@student-management-system/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-management-system/ui/components/select";
import { Separator } from "@student-management-system/ui/components/separator";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { gooeyToast } from "goey-toast";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useForm,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
} from "react-hook-form";

import { trpc } from "@/utils/trpc";

// Default values for the form. Numeric fields use empty string so the Input
// starts blank; the schema's preprocessor turns those into `undefined` (→
// "Required") instead of NaN.
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
  duration: "3 months",
  level: "Level 1",
  tutorName: "Balaji",
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

  const paymentPlan = form.watch("paymentPlan");

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
    // `values` is the permissive input shape. The schema has already
    // been applied by zodResolver, so numeric fields are real numbers.
    createStudent.mutate(values as Parameters<typeof createStudent.mutate>[0]);
  };

  // Surfaces validation failures so a click that silently drops because
  // some required field is empty becomes visible instead of a no-op.
  const onInvalid = (errors: Record<string, { message?: string }>) => {
    const fieldNames = Object.keys(errors);
    const firstMessage =
      fieldNames.length > 0 && errors[fieldNames[0]]?.message
        ? errors[fieldNames[0]]?.message
        : "Please fix the highlighted fields";
    gooeyToast.error(`${fieldNames.length} field(s) need attention`, {
      showTimestamp: false,
      borderColor: "#E0E0E0",
      borderWidth: 1.5,
      description: firstMessage,
      timing: { displayDuration: 5000 },
    });
  };

  return (
    <Form {...form}>
      <form
        className="mx-auto w-full max-w-5xl space-y-8 py-6"
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      >
        <h1 className="text-center text-lg font-semibold text-foreground">
          Enter the all the details to add new student
        </h1>

        {/* --- Student info --- */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <LabeledField
              control={form.control}
              name="name"
              label="Student Name"
            >
              {(field) => <Input {...field} value={field.value ?? ""} />}
            </LabeledField>

            <LabeledField
              control={form.control}
              name="rollNumber"
              label="Roll Number"
            >
              {(field) => <Input {...field} value={field.value ?? ""} />}
            </LabeledField>

            <LabeledField control={form.control} name="age" label="Age">
              {(field) => (
                <Input
                  type="number"
                  inputMode="numeric"
                  {...field}
                  value={(field.value as number | string | undefined) ?? ""}
                />
              )}
            </LabeledField>

            <LabeledField
              control={form.control}
              name="phoneNumber"
              label="Phone Number"
            >
              {(field) => (
                <Input
                  type="tel"
                  inputMode="numeric"
                  {...field}
                  value={field.value ?? ""}
                />
              )}
            </LabeledField>

            <LabeledField control={form.control} name="email" label="Email">
              {(field) => (
                <Input type="email" {...field} value={field.value ?? ""} />
              )}
            </LabeledField>

            <LabeledField
              control={form.control}
              name="schoolName"
              label="School Name"
            >
              {(field) => <Input {...field} value={field.value ?? ""} />}
            </LabeledField>
          </div>

          <div className="space-y-4">
            <LabeledField
              control={form.control}
              name="standard"
              label="Standard"
            >
              {(field) => <Input {...field} value={field.value ?? ""} />}
            </LabeledField>

            <LabeledField
              control={form.control}
              name="academicYear"
              label="Academic Year"
            >
              {(field) => <Input {...field} value={field.value ?? ""} />}
            </LabeledField>

            <LabeledField
              control={form.control}
              name="motherName"
              label="Mother Name"
            >
              {(field) => <Input {...field} value={field.value ?? ""} />}
            </LabeledField>

            <LabeledField
              control={form.control}
              name="motherOccupation"
              label="Mother Occupation"
            >
              {(field) => <Input {...field} value={field.value ?? ""} />}
            </LabeledField>

            <LabeledField
              control={form.control}
              name="fatherName"
              label="Father Name"
            >
              {(field) => <Input {...field} value={field.value ?? ""} />}
            </LabeledField>

            <LabeledField
              control={form.control}
              name="fatherOccupation"
              label="Father Occupation"
            >
              {(field) => <Input {...field} value={field.value ?? ""} />}
            </LabeledField>
          </div>
        </div>

        <Separator />

        {/* --- Enrollment --- */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <LabeledSelect
              control={form.control}
              name="course"
              label="Course"
              placeholder="Select a Course"
              options={COURSES}
            />

            <LabeledSelect
              control={form.control}
              name="duration"
              label="Duration"
              placeholder="Select a Duration"
              options={DURATIONS}
            />

            <LabeledSelect
              control={form.control}
              name="level"
              label="Level"
              placeholder="Select a Level"
              options={LEVELS}
            />

            <LabeledSelect
              control={form.control}
              name="tutorName"
              label="Tutor Name"
              placeholder="Tutor Name"
              options={TUTOR_NAMES}
            />

            {/* Start Date — DatePicker */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => {
                const selectedDate =
                  field.value instanceof Date ? field.value : undefined;
                return (
                  <FormItem className="grid grid-cols-[120px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
                    <FormLabel>Start Date</FormLabel>
                    <div>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <button
                              className="flex h-8 w-full items-center justify-between rounded-none border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                              type="button"
                            >
                              <span>
                                {selectedDate
                                  ? format(selectedDate, "PPP")
                                  : "Pick a date"}
                              </span>
                              <CalendarIcon className="size-3.5 text-muted-foreground" />
                            </button>
                          }
                        />
                        <PopoverContent align="start" className="p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="mt-1" />
                    </div>
                  </FormItem>
                );
              }}
            />

            <LabeledSelect
              control={form.control}
              name="studentStatus"
              label="Student Status"
              placeholder="Select a status"
              options={STUDENT_STATUSES}
            />
          </div>

          <div className="space-y-4">
            {/* Fees — displayed in rupees but stored as paise */}
            <FormField
              control={form.control}
              name="totalFees"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[120px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
                  <FormLabel>Fees</FormLabel>
                  <div>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Amount in rupees"
                        value={
                          typeof field.value === "number" && field.value > 0
                            ? field.value / 100
                            : ""
                        }
                        onChange={(event) => {
                          const rupees = event.target.value;
                          field.onChange(
                            rupees === ""
                              ? ("" as unknown as number)
                              : Math.round(Number(rupees) * 100)
                          );
                        }}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage className="mt-1" />
                  </div>
                </FormItem>
              )}
            />

            {/* Payment Plan — radio group */}
            <FormField
              control={form.control}
              name="paymentPlan"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[120px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
                  <FormLabel>Payment Plan</FormLabel>
                  <div>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "single") {
                            form.setValue("emiMonths", null, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      >
                        <RadioGroupItem value="single">Single</RadioGroupItem>
                        <RadioGroupItem value="flexible">
                          Flexible
                        </RadioGroupItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="mt-1" />
                  </div>
                </FormItem>
              )}
            />

            {/* Emi Duration — only for flexible plan */}
            {paymentPlan === "flexible" && (
              <FormField
                control={form.control}
                name="emiMonths"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[120px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
                    <FormLabel>Emi Duration</FormLabel>
                    <div>
                      <FormControl>
                        <Select
                          value={
                            field.value === null || field.value === undefined
                              ? undefined
                              : String(field.value)
                          }
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                        >
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMI_MONTHS_OPTIONS.map((months) => (
                              <SelectItem key={months} value={String(months)}>
                                {months} Months
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </div>
                  </FormItem>
                )}
              />
            )}

            <LabeledSelect
              control={form.control}
              name="enrolledMedium"
              label="Enrolled via"
              placeholder="Select Medium"
              options={ENROLLED_MEDIUMS}
            />

            <LabeledSelect
              control={form.control}
              name="studentSource"
              label="Source"
              placeholder="Select source"
              options={STUDENT_SOURCES}
            />

            {/* Kit Provided — radio group */}
            <FormField
              control={form.control}
              name="kitProvided"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[120px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
                  <FormLabel>Kit Provided</FormLabel>
                  <div>
                    <FormControl>
                      <RadioGroup
                        value={field.value ? "yes" : "no"}
                        onValueChange={(value) =>
                          field.onChange(value === "yes")
                        }
                      >
                        <RadioGroupItem value="yes">Yes</RadioGroupItem>
                        <RadioGroupItem value="no">No</RadioGroupItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="mt-1" />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="blue"
            disabled={createStudent.isPending}
          >
            {createStudent.isPending ? "Adding..." : "Add Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ---------- Small internal helpers ----------

type FieldRender<Name extends FieldPath<CreateStudentInput>> =
  ControllerRenderProps<CreateStudentInput, Name>;

// Text-ish field: shared label layout + render prop for the input.
function LabeledField<Name extends FieldPath<CreateStudentInput>>({
  control,
  name,
  label,
  children,
}: {
  control: Control<CreateStudentInput>;
  name: Name;
  label: string;
  children: (field: FieldRender<Name>) => React.ReactElement;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="grid grid-cols-[120px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
          <FormLabel>{label}</FormLabel>
          <div>
            <FormControl>{children(field)}</FormControl>
            <FormMessage className="mt-1" />
          </div>
        </FormItem>
      )}
    />
  );
}

// Select field: same layout, wraps the shadcn Select.
function LabeledSelect<Name extends FieldPath<CreateStudentInput>>({
  control,
  name,
  label,
  placeholder,
  options,
}: {
  control: Control<CreateStudentInput>;
  name: Name;
  label: string;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="grid grid-cols-[120px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
          <FormLabel>{label}</FormLabel>
          <div>
            <FormControl>
              <Select
                value={(field.value as string) ?? ""}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage className="mt-1" />
          </div>
        </FormItem>
      )}
    />
  );
}
