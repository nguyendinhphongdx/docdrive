"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FileText, LayoutDashboard, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";

export function EditorTopBar() {
  const { data: session, status } = useSession();
  const authed = !!session?.user && status === "authenticated";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <FileText className="h-4 w-4" />
        <span>docdrive</span>
      </Link>
      <div className="flex-1" />
      {authed ? (
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <LayoutDashboard className="mr-1 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      ) : (
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">
            <LogIn className="mr-1 h-4 w-4" />
            Sign in
          </Link>
        </Button>
      )}
      <ThemeToggle />
    </header>
  );
}
