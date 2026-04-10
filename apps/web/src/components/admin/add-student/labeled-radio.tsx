import type { CreateStudentInput } from "@student-management-system/api/schemas/student";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@student-management-system/ui/components/form";
import {
  RadioGroup,
  RadioGroupItem,
} from "@student-management-system/ui/components/radio-group";
import type { Control, FieldPath } from "react-hook-form";

export function LabeledRadio<Name extends FieldPath<CreateStudentInput>>({
  control,
  name,
  label,
  options,
  onValueChange,
}: {
  control: Control<CreateStudentInput>;
  name: Name;
  label: string;
  options: { value: string; label: string }[];
  onValueChange?: (value: string) => void;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
          <FormLabel>{label}</FormLabel>
          <div>
            <FormControl>
              <RadioGroup
                value={field.value as string}
                onValueChange={(value) => {
                  field.onChange(value);
                  onValueChange?.(value);
                }}
              >
                {options.map((option) => (
                  <RadioGroupItem key={option.value} value={option.value}>
                    {option.label}
                  </RadioGroupItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage className="mt-1" />
          </div>
        </FormItem>
      )}
    />
  );
}
