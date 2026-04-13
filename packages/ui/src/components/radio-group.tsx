"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cn } from "@student-management-system/ui/lib/utils";

function RadioGroup<Value>({
  className,
  ...props
}: RadioGroupPrimitive.Props<Value>) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex items-center gap-4", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  children,
  ...props
}: RadioPrimitive.Root.Props) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs">
      <RadioPrimitive.Root
        data-slot="radio-item"
        className={cn(
          "relative flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-transparent transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary",
          className
        )}
        {...props}
      >
        <RadioPrimitive.Indicator
          data-slot="radio-indicator"
          className="size-2 rounded-full bg-primary data-unchecked:hidden"
        />
      </RadioPrimitive.Root>
      {children}
    </label>
  );
}

export { RadioGroup, RadioGroupItem };
