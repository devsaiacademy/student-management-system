import type { CreateStudentInput } from "@student-management-system/api/schemas/student";
import { STANDARDS } from "@student-management-system/db/schema/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@student-management-system/ui/components/card";
import { Input } from "@student-management-system/ui/components/input";
import type { Control } from "react-hook-form";

import { LabeledField } from "./labeled-field";
import { LabeledSelect } from "./labeled-select";

const STANDARD_OPTIONS = STANDARDS.map(String);

function TextField({
  control,
  name,
  label,
  type,
  inputMode,
}: {
  control: Control<CreateStudentInput>;
  name: keyof CreateStudentInput;
  label: string;
  type?: string;
  inputMode?: "numeric";
}) {
  return (
    <LabeledField control={control} name={name} label={label}>
      {(field) => (
        <Input
          className="rounded-[8px]"
          type={type}
          inputMode={inputMode}
          {...field}
          value={(field.value as string | number | undefined) ?? ""}
        />
      )}
    </LabeledField>
  );
}

export function StudentInfoCard({
  control,
}: {
  control: Control<CreateStudentInput>;
}) {
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-3 rounded-[12px] transition-shadow duration-200 hover:shadow-sm"
      style={{
        animationDelay: "60ms",
        animationDuration: "400ms",
        animationFillMode: "backwards",
      }}
    >
      <CardHeader className="border-b">
        <CardTitle>Student Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-8 gap-y-0 md:grid-cols-2">
          <div className="space-y-4">
            <TextField control={control} name="name" label="Student Name" />
            <TextField
              control={control}
              name="rollNumber"
              label="Roll Number"
            />
            <TextField
              control={control}
              name="age"
              label="Age"
              type="number"
              inputMode="numeric"
            />
            <TextField
              control={control}
              name="phoneNumber"
              label="Phone Number"
              type="tel"
              inputMode="numeric"
            />
            <TextField
              control={control}
              name="email"
              label="Email"
              type="email"
            />
            <TextField
              control={control}
              name="schoolName"
              label="School Name"
            />
          </div>
          <div className="space-y-4">
            <LabeledSelect
              control={control}
              name="standard"
              label="Standard"
              placeholder="Select Standard"
              options={STANDARD_OPTIONS}
            />
            <TextField
              control={control}
              name="academicYear"
              label="Academic Year"
            />
            <TextField
              control={control}
              name="motherName"
              label="Mother Name"
            />
            <TextField
              control={control}
              name="motherOccupation"
              label="Mother Occupation"
            />
            <TextField
              control={control}
              name="fatherName"
              label="Father Name"
            />
            <TextField
              control={control}
              name="fatherOccupation"
              label="Father Occupation"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
