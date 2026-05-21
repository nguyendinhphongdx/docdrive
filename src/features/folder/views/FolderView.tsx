import Link from "next/link";
import { ChevronRight, FileText, Folder as FolderIcon, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRemaining, type Visibility } from "@/features/document";
import { FolderViewActions } from "./FolderViewActions";

interface FolderViewProps {
  folder: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    parentId: string | null;
    visibility: Visibility;
    shareToken: string | null;
    createdAt: string;
    updatedAt: string;
  };
  breadcrumbs: Array<{ slug: string; name: string }>;
  subfolders: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    documentCount: number;
    childCount: number;
  }>;
  documents: Array<{
    slug: string;
    title: string | null;
    contentType: "MARKDOWN" | "HTML";
    visibility: Visibility;
    shareToken: string | null;
    expiresAt: string | null;
    viewCount: number;
    createdAt: string;
  }>;
}

export function FolderView({
  folder,
  breadcrumbs,
  subfolders,
  documents,
}: FolderViewProps) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {breadcrumbs.map((b) => (
          <span key={b.slug} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <Link href={`/f/${b.slug}`} className="hover:text-foreground">
              {b.name}
            </Link>
          </span>
        ))}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{folder.name}</span>
      </nav>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderIcon className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-semibold tracking-tight">{folder.name}</h1>
          </div>
          {folder.description && (
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              {folder.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <FolderViewActions
            folderId={folder.id}
            folderSlug={folder.slug}
            folderName={folder.name}
            visibility={folder.visibility}
            shareToken={folder.shareToken}
          />
          <Button asChild>
            <Link href={`/editor?folderId=${folder.id}`}>
              <Plus className="mr-1 h-4 w-4" />
              New document
            </Link>
          </Button>
        </div>
      </div>

      {subfolders.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subfolders
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subfolders.map((c) => (
              <Link
                key={c.id}
                href={`/f/${c.slug}`}
                className="group rounded-lg border bg-background p-4 transition-colors hover:border-foreground/30"
              >
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-5 w-5 text-amber-500" />
                  <div className="flex-1 truncate font-medium">{c.name}</div>
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {c.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.documentCount} doc{c.documentCount === 1 ? "" : "s"}
                  {c.childCount > 0 && `, ${c.childCount} subfolder${c.childCount === 1 ? "" : "s"}`}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documents
        </h2>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No documents in this folder yet.</p>
            <Button asChild size="sm">
              <Link href={`/editor?folderId=${folder.id}`}>
                <Plus className="mr-1 h-4 w-4" />
                New document
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {documents.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={`/d/${doc.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {doc.title ?? "Untitled"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString()} ·{" "}
                      {doc.viewCount} view{doc.viewCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {doc.contentType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRemaining(doc.expiresAt ? new Date(doc.expiresAt) : null)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
