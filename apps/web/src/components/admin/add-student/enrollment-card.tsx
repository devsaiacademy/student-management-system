import type { CreateStudentInput } from "@student-management-system/api/schemas/student";
import {
  COURSES,
  DURATIONS,
  EMI_MONTHS_OPTIONS,
  CLOSED_BY_NAMES,
  REACHED_US_BY_OPTIONS,
  LEVELS,
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
  const [kitProvided, setKitProvided] = useState<boolean>(
    Boolean(form.watch("kitProvided"))
  );

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
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          <div className="space-y-4 md:space-y-6">
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
              name="closedBy"
              label="Closed By"
              placeholder="Closed By"
              options={CLOSED_BY_NAMES}
            />
            <DatePickerField
              control={form.control}
              name="admissionDate"
              label="Admission Date"
            />
          </div>

          <div className="space-y-4">
            <FeesField control={form.control} />
            <InitialAmountField control={form.control} />

            <LabeledRadio
              control={form.control}
              name="paymentPlan"
              label="Payment Plan"
              options={[
                { value: "single", label: "Single" },
                { value: "installment", label: "Installment" },
              ]}
              onValueChange={(value) => {
                if (value === "single") {
                  setPaymentPlan("single");
                  form.setValue("emiMonths", null, { shouldValidate: true });
                } else {
                  setPaymentPlan("installment");
                  form.setValue("emiMonths", 2, { shouldValidate: true });
                }
              }}
            />

            {paymentPlan === "installment" && (
              <FormField
                control={form.control}
                name="emiMonths"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
                    <FormLabel className="text-sm">Emi Duration</FormLabel>
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
                          <SelectTrigger className="h-8 w-full max-w-[300px] rounded-[8px] text-sm">
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
              name="reachedUsBy"
              label="Reached Us By"
              placeholder="Select Medium"
              options={REACHED_US_BY_OPTIONS}
            />

            <LabeledRadio
              control={form.control}
              name="kitProvided"
              label="Kit Provided"
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
              onValueChange={(value) => {
                // LabeledRadio's generic types value as string, but Base UI
                // passes the RadioGroupItem's actual value prop through. For
                // this radio the options are booleans, so `value` is the
                // boolean at runtime.
                const enabled = (value as unknown) === true || value === "true";
                setKitProvided(enabled);
                if (!enabled) {
                  form.setValue("kitCost", undefined, { shouldValidate: true });
                }
              }}
            />

            {kitProvided ? <KitCostField control={form.control} /> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KitCostField({
  control,
}: {
  control: UseFormReturn<CreateStudentInput>["control"];
}) {
  return (
    <FormField
      control={control}
      name="kitCost"
      render={({ field }) => (
        <FormItem className="grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
          <FormLabel className="text-sm">Kit Cost</FormLabel>
          <div>
            <FormControl>
              <Input
                className="max-w-[300px] rounded-[8px] text-sm"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Amount in rupees (0 if complementary)"
                value={typeof field.value === "number" ? field.value : ""}
                onChange={(event) => {
                  const rupees = event.target.value;
                  field.onChange(rupees === "" ? undefined : Number(rupees));
                }}
                onBlur={field.onBlur}
                ref={field.ref}
                name={field.name}
              />
            </FormControl>
            <FormMessage className="mt-1" />
            {typeof field.value === "number" && field.value >= 0 && (
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

function InitialAmountField({
  control,
}: {
  control: UseFormReturn<CreateStudentInput>["control"];
}) {
  return (
    <FormField
      control={control}
      name="initialAmount"
      render={({ field }) => (
        <FormItem className="grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
          <FormLabel className="text-sm">Initial Amount</FormLabel>
          <div>
            <FormControl>
              <Input
                className="max-w-[300px] rounded-[8px] text-sm"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Amount paid upfront (0 if none)"
                value={typeof field.value === "number" ? field.value : ""}
                onChange={(event) => {
                  const rupees = event.target.value;
                  field.onChange(rupees === "" ? undefined : Number(rupees));
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
          <FormLabel className="text-sm">Fees</FormLabel>
          <div>
            <FormControl>
              <Input
                className="max-w-[300px] rounded-[8px] text-sm"
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
