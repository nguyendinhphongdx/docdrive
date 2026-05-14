"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CreateFolderDialog,
  FolderTree,
  type SelectedFolder,
} from "@/features/folder";
import { DocumentsTable } from "../components/DocumentsTable";

export function DashboardView() {
  const [selected, setSelected] = useState<SelectedFolder | null>(null);

  const targetFolderId = selected?.id ?? null;
  const editorHref = targetFolderId
    ? `/editor?folderId=${targetFolderId}`
    : "/editor";

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
          <CreateFolderDialog parentId={targetFolderId} />
          <Button asChild>
            <Link href={editorHref}>
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
          <FolderTree selectedId={targetFolderId} onSelect={setSelected} />
        </aside>

        <section className="rounded-lg border">
          <header className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {selected
              ? `Documents in ${selected.name}`
              : "Documents in My drive (root)"}
          </header>
          <DocumentsTable folderId={targetFolderId} />
        </section>
      </div>
    </main>
  );
}
