import type { CreateStudentInput } from "@student-management-system/api/schemas/student";
import { Button } from "@student-management-system/ui/components/button";
import { Calendar } from "@student-management-system/ui/components/calendar";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@student-management-system/ui/components/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@student-management-system/ui/components/popover";
import { format } from "date-fns";
import type { Control, FieldPath } from "react-hook-form";

export function DatePickerField<Name extends FieldPath<CreateStudentInput>>({
  control,
  name,
  label,
}: {
  control: Control<CreateStudentInput>;
  name: Name;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedDate =
          field.value instanceof Date ? field.value : undefined;
        return (
          <FormItem className="grid grid-cols-[140px_1fr] items-center gap-x-3 gap-y-1 space-y-0">
            <FormLabel>{label}</FormLabel>
            <div>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      type="button"
                      className="h-8 w-full justify-start rounded-[8px] border-input px-2.5 text-xs font-normal"
                    >
                      {selectedDate
                        ? format(selectedDate, "dd/MM/yyyy")
                        : "Pick a date"}
                    </Button>
                  }
                />
                <PopoverContent align="start" className="rounded-[8px] p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    defaultMonth={selectedDate}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(date);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage className="mt-1" />
            </div>
          </FormItem>
        );
      }}
    />
  );
}
