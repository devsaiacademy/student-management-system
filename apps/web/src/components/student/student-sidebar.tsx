"use client";

import {
  Avatar,
  AvatarFallback,
} from "@student-management-system/ui/components/avatar";
import { Separator } from "@student-management-system/ui/components/separator";
import { cn } from "@student-management-system/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, LogOut } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { trpc } from "@/utils/trpc";

const navItems = [{ label: "Billing", href: "/student", icon: CreditCard }];

type StudentSidebarProps = {
  user: { email: string; name?: string } | null;
};

export function StudentSidebar({ user }: StudentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation(
    trpc.auth.logout.mutationOptions({
      onSuccess: () => {
        queryClient.clear();
        router.push("/login?role=parent");
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
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

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
            {user?.name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "S"}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {user?.name ?? "Student"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {logoutMutation.isPending ? "Signing out…" : (user?.email ?? "")}
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
