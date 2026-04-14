import type { CreateStudentInput } from "@student-management-system/api/schemas/student";
import {
  COURSES,
  DURATIONS,
  EMI_MONTHS_OPTIONS,
  STUDENT_SOURCES,
  LEVELS,
  STUDENT_STATUSES,
  TUTOR_NAMES,
} from "@student-management-system/db/schema/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@student-management-system/ui/components/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@student-management-system/ui/components/form";
import { Input } from "@student-management-system/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-management-system/ui/components/select";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toCurrency } from "to-words/en-IN";

import { DatePickerField } from "./date-picker-field";
import { LabeledRadio } from "./labeled-radio";
import { LabeledSelect } from "./labeled-select";

export function EnrollmentCard({
  form,
}: {
  form: UseFormReturn<CreateStudentInput>;
}) {
  const [paymentPlan, setPaymentPlan] = useState(form.watch("paymentPlan"));

  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-3 rounded-[12px] transition-shadow duration-200 hover:shadow-sm"
      style={{
        animationDelay: "120ms",
        animationDuration: "400ms",
        animationFillMode: "backwards",
      }}
    >
      <CardHeader className="border-b">
        <CardTitle>Enrollment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-8 gap-y-0 md:grid-cols-2">
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
            <DatePickerField
              control={form.control}
              name="startDate"
              label="Start Date"
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
            <FeesField control={form.control} />

            <LabeledRadio
              control={form.control}
              name="paymentPlan"
              label="Payment Plan"
              options={[
                { value: "single", label: "Single" },
                { value: "flexible", label: "Flexible" },
              ]}
              onValueChange={(value) => {
                if (value === "single") {
                  setPaymentPlan("single");
                  form.setValue("emiMonths", null, { shouldValidate: true });
                } else {
                  setPaymentPlan("flexible");
                  form.setValue("emiMonths", 2, { shouldValidate: true });
                }
              }}
            />

            {paymentPlan === "flexible" && (
              <FormField
                control={form.control}
                name="emiMonths"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
                    <FormLabel>Emi Duration</FormLabel>
                    <div>
                      <FormControl>
                        <Select
                          value={
                            field.value == null
                              ? undefined
                              : String(field.value)
                          }
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                        >
                          <SelectTrigger className="h-8 w-full rounded-[8px]">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent
                            className="rounded-[6px]"
                            alignItemWithTrigger={false}
                          >
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
              name="studentSource"
              label="Enrolled via"
              placeholder="Select Medium"
              options={STUDENT_SOURCES}
            />

            <LabeledRadio
              control={form.control}
              name="kitProvided"
              label="Kit Provided"
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeesField({
  control,
}: {
  control: UseFormReturn<CreateStudentInput>["control"];
}) {
  return (
    <FormField
      control={control}
      name="totalFees"
      render={({ field }) => (
        <FormItem className="grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
          <FormLabel>Fees</FormLabel>
          <div>
            <FormControl>
              <Input
                className="rounded-[8px]"
                type="number"
                inputMode="numeric"
                placeholder="Amount in rupees"
                value={
                  typeof field.value === "number" && field.value > 0
                    ? field.value
                    : ""
                }
                onChange={(event) => {
                  const rupees = event.target.value;
                  field.onChange(
                    rupees === "" ? ("" as unknown as number) : Number(rupees)
                  );
                }}
                onBlur={field.onBlur}
                ref={field.ref}
                name={field.name}
              />
            </FormControl>
            <FormMessage className="mt-1" />
            {typeof field.value === "number" && field.value > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {toCurrency(field.value)}
              </p>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}
