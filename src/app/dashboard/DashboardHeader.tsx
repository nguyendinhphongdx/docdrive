"use client";

import Link from "next/link";
import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { FileText, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface DashboardHeaderProps {
  user: { email?: string | null; name?: string | null };
}

function getInitials(value: string | null | undefined): string {
  if (!value) return "U";
  const parts = value.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return value.slice(0, 2).toUpperCase();
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [signingOut, startSignOut] = useTransition();
  const initials = getInitials(user.name ?? user.email);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <FileText className="h-4 w-4" />
        <span>docdrive</span>
      </Link>
      <div className="flex-1" />
      <Button asChild size="sm">
        <Link href="/editor">
          <Plus className="mr-1 h-4 w-4" />
          New
        </Link>
      </Button>
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="space-y-0.5">
            <p className="text-sm font-medium leading-none">
              {user.name ?? "Account"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={signingOut}
            onSelect={(e) => {
              e.preventDefault();
              startSignOut(() => {
                void signOut({ callbackUrl: "/" });
              });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
