"use client";

import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import { Separator } from "@student-management-system/ui/components/separator";
import { cn } from "@student-management-system/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CreditCard,
  FileBarChart,
  LogOut,
  Users,
  UserPlus,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { trpc } from "@/utils/trpc";

const navItems = [
  { label: "Students", href: "/admin/all-students", icon: Users },
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
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation(
    trpc.auth.logout.mutationOptions({
      onSuccess: () => {
        // Drop every cached query so the next page can't read stale data
        // belonging to the previous user.
        queryClient.clear();
        router.push("/login?role=teacher");
        router.refresh();
      },
    })
  );

  const handleLogout = () => {
    if (logoutMutation.isPending) {
      return;
    }
    logoutMutation.mutate();
  };

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
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              href={item.href as Route}
              key={item.href}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <button
        aria-label="Log out"
        className={cn(
          "group flex items-center gap-3 px-4 py-4 text-left transition-colors",
          "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
        disabled={logoutMutation.isPending}
        onClick={handleLogout}
        type="button"
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {user?.name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "A"}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {user?.name ?? "Admin User"}
          </span>
          <span className="truncate text-xs text-muted-foreground group-hover:text-foreground">
            {logoutMutation.isPending
              ? "Signing out…"
              : (user?.email ?? "admin@otomatiks.in")}
          </span>
        </div>
        <LogOut
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-destructive"
        />
      </button>
    </aside>
  );
}
