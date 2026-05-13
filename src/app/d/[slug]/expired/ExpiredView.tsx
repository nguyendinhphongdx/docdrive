import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExpiredView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Clock className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">This share has expired</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The link you followed pointed to a share whose lifetime has ended. The
        content is no longer available.
      </p>
      <Button asChild>
        <Link href="/editor">Create a new share</Link>
      </Button>
    </div>
  );
}
