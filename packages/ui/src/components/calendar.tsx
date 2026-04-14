"use client";

import { cn } from "@student-management-system/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import "react-day-picker/style.css";

// Thin wrapper around react-day-picker (v9). Keeps the tight aesthetic used
// across the rest of the UI package. We lean on the library's default class
// names for layout and only override the chevron icons.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fixedWeeks = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks={fixedWeeks}
      className={cn("p-2 text-xs", className)}
      classNames={classNames}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
