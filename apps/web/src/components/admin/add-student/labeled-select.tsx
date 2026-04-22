import type { CreateStudentInput } from "@student-management-system/api/schemas/student";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@student-management-system/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@student-management-system/ui/components/select";
import type { Control, FieldPath } from "react-hook-form";

export function LabeledSelect<Name extends FieldPath<CreateStudentInput>>({
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
        <FormItem className="grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
          <FormLabel className="text-sm">{label}</FormLabel>
          <div>
            <FormControl>
              <Select
                value={(field.value as string) ?? ""}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="h-8 w-full max-w-[300px] rounded-[8px] text-sm">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                  className="rounded-[6px]"
                  alignItemWithTrigger={false}
                >
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
