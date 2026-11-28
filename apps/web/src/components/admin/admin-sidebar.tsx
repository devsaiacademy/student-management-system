"use client";

import type { UserRole } from "@student-management-system/db/schema/constants";
import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@student-management-system/ui/components/sidebar";
import { cn } from "@student-management-system/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CreditCard,
  FileBarChart,
  LogOut,
  UserPlus,
  Users,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { TeachersIcon } from "@/components/icons/teachers-icon";
import { trpc } from "@/utils/trpc";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  rolesAllowed?: UserRole[];
};

// Users is admin-only (admin + super_admin); everything else is staff-or-above.
const navItems: NavItem[] = [
  { label: "Students", href: "/admin/all-students", icon: Users },
  { label: "Add Student", href: "/admin/add-student", icon: UserPlus },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Reports", href: "/admin/reports", icon: FileBarChart },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  {
    label: "Teachers",
    href: "/admin/teachers",
    icon: TeachersIcon,
    rolesAllowed: ["admin", "super_admin"],
  },
];

type AdminSidebarProps = {
  role: UserRole;
  user: { email: string; name?: string } | null;
};

export function AdminSidebar({ role, user }: AdminSidebarProps) {
  const visibleNavItems = navItems.filter(
    (item) => !item.rolesAllowed || item.rolesAllowed.includes(role)
  );
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
    <Sidebar>
      <SidebarHeader>
        <Image
          alt="Otomatiks Logo"
          className="h-8 w-auto group-data-[state=collapsed]/sidebar:hidden"
          height={32}
          priority
          src="/logo.svg"
          width={150}
        />
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarMenu>
          {visibleNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <Link href={item.href as Route}>
                    <item.icon className="size-4 shrink-0" />
                    <span className="group-data-[state=collapsed]/sidebar:hidden">
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <button
          aria-label="Log out"
          className={cn(
            "group flex items-center gap-3 px-4 py-4 text-left transition-colors",
            "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-2"
          )}
          disabled={logoutMutation.isPending}
          onClick={handleLogout}
          type="button"
        >
          <Avatar className="size-9 group-data-[state=collapsed]/sidebar:size-8">
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
              {user?.name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col group-data-[state=collapsed]/sidebar:hidden">
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
            className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-destructive group-data-[state=collapsed]/sidebar:hidden"
          />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
