import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";

type StudentHeaderProps = {
  student: {
    name: string;
    email: string;
    phoneNumber: string;
  };
};

export function StudentHeader({ student }: StudentHeaderProps) {
  return (
    <header className="flex items-start gap-8 border-b border-border px-8 py-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
            {student.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-base font-semibold text-foreground">
            {student.name}
          </span>
          <span className="text-xs text-muted-foreground">{student.email}</span>
          <span className="text-xs text-muted-foreground">
            +91 {student.phoneNumber}
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-foreground">Student Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your enrolled course and split payment schedule in one place.
        </p>
      </div>
    </header>
  );
}
