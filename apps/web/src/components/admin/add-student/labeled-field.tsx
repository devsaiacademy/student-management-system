import type { CreateStudentInput } from "@student-management-system/api/schemas/student";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@student-management-system/ui/components/form";
import type {
  Control,
  ControllerRenderProps,
  FieldPath,
} from "react-hook-form";

export type FieldRender<Name extends FieldPath<CreateStudentInput>> =
  ControllerRenderProps<CreateStudentInput, Name>;

export function LabeledField<Name extends FieldPath<CreateStudentInput>>({
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
        <FormItem className="grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
          <FormLabel className="text-sm">{label}</FormLabel>
          <div>
            <FormControl>{children(field)}</FormControl>
            <FormMessage className="mt-1" />
          </div>
        </FormItem>
      )}
    />
  );
}
