import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentsTable } from "../components/DocumentsTable";
import { CreateFolderDialog, FolderTree } from "@/features/folder";

export function DashboardView() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My drive</h1>
          <p className="text-sm text-muted-foreground">
            Every folder and document you&apos;ve created while signed in.
          </p>
        </div>
        <div className="flex gap-2">
          <CreateFolderDialog />
          <Button asChild>
            <Link href="/editor">
              <Plus className="mr-1 h-4 w-4" />
              New document
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border bg-muted/20 p-2">
          <h2 className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Folders
          </h2>
          <FolderTree />
        </aside>

        <section className="rounded-lg border">
          <header className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Documents in My drive (root)
          </header>
          <DocumentsTable folderId={null} />
        </section>
      </div>
    </main>
  );
}
