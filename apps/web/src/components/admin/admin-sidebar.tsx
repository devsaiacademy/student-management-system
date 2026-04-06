"use client";

import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import { Separator } from "@student-management-system/ui/components/separator";
import { cn } from "@student-management-system/ui/lib/utils";
import {
  BookOpen,
  ChevronUp,
  CreditCard,
  FileBarChart,
  Users,
  UserPlus,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Students", href: "/admin", icon: Users },
  { label: "Add Student", href: "/admin/add-student", icon: UserPlus },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Reports", href: "/admin/reports", icon: FileBarChart },
];

type AdminSidebarProps = {
  user: { email: string; name?: string } | null;
};

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-border bg-background">
      <div className="flex items-center gap-2 px-5 py-5">
        <Image
          alt="Otomatiks Logo"
          className="h-8 w-auto"
          height={32}
          priority
          src="/logo.svg"
          width={150}
        />
      </div>

      <Separator />

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item, index) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="flex items-center gap-3 px-4 py-4">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {user?.name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "A"}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {user?.name ?? "Admin User"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {user?.email ?? "admin@otomatiks.in"}
          </span>
        </div>
        <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
      </div>
    </aside>
  );
}
