"use client";

import { cn } from "@student-management-system/ui/lib/utils";
import { Pencil, Trash2 } from "lucide-react";

type CourseCardProps = {
  course: { id: number; name: string; description: string };
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
};

export function CourseCard({
  course,
  index,
  onEdit,
  onDelete,
  canManage,
}: CourseCardProps) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col gap-3 rounded-[12px] bg-background p-5 shadow-sm ring-1 ring-foreground/10",
        "transition-all duration-200 hover:shadow-md",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "backwards",
      }}
    >
      <header className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-sm font-medium text-foreground">
          {course.name}
        </h3>
        {canManage ? (
          <div className="flex shrink-0 items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
            <button
              aria-label={`Delete ${course.name}`}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onDelete}
              type="button"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
            <button
              aria-label={`Edit ${course.name}`}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onEdit}
              type="button"
            >
              <Pencil aria-hidden className="size-4" />
            </button>
          </div>
        ) : null}
      </header>

      <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
        {course.description}
      </p>
    </article>
  );
}
