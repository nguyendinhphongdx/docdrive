import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Folder as FolderIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatRemaining } from "@/features/document";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

async function buildBreadcrumbs(
  parentId: string | null,
): Promise<Array<{ shareToken: string; name: string }>> {
  const trail: Array<{ shareToken: string; name: string }> = [];
  let current = parentId;
  let safety = 0;
  while (current && safety < 12) {
    const node: {
      shareToken: string | null;
      name: string;
      parentId: string | null;
      visibility: "PRIVATE" | "PUBLIC";
    } | null = await db.folder.findUnique({
      where: { id: current },
      select: { shareToken: true, name: true, parentId: true, visibility: true },
    });
    if (!node) break;
    if (node.visibility === "PUBLIC" && node.shareToken) {
      trail.unshift({ shareToken: node.shareToken, name: node.name });
    }
    current = node.parentId;
    safety += 1;
  }
  return trail;
}

export async function generateMetadata({ params }: PageProps) {
  const { shareToken } = await params;
  const folder = await db.folder.findUnique({
    where: { shareToken },
    select: { name: true, description: true, visibility: true },
  });
  if (!folder || folder.visibility !== "PUBLIC") {
    return createMetadata({ path: `/sf/${shareToken}`, title: "Folder not found" });
  }
  return createMetadata({
    path: `/sf/${shareToken}`,
    title: folder.name,
    description: folder.description ?? "A shared folder of documents.",
  });
}

export default async function PublicFolderPage({ params }: PageProps) {
  const { shareToken } = await params;
  const folder = await db.folder.findUnique({
    where: { shareToken },
    select: {
      id: true,
      name: true,
      description: true,
      parentId: true,
      visibility: true,
      expiresAt: true,
    },
  });
  if (!folder || folder.visibility !== "PUBLIC") notFound();

  if (folder.expiresAt && folder.expiresAt <= new Date()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">This folder has expired</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The share link is no longer active.
        </p>
      </div>
    );
  }

  const [breadcrumbs, subfolders, documents] = await Promise.all([
    buildBreadcrumbs(folder.parentId),
    db.folder.findMany({
      where: { parentId: folder.id, visibility: "PUBLIC" },
      orderBy: { name: "asc" },
      select: {
        shareToken: true,
        name: true,
        description: true,
        _count: { select: { documents: true, children: true } },
      },
    }),
    db.document.findMany({
      where: {
        folderId: folder.id,
        visibility: "PUBLIC",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        shareToken: true,
        title: true,
        contentType: true,
        expiresAt: true,
        viewCount: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Home
          </Link>
        </Button>
        <div className="flex-1" />
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          {breadcrumbs.map((b) => (
            <span key={b.shareToken} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <Link href={`/sf/${b.shareToken}`} className="hover:text-foreground">
                {b.name}
              </Link>
            </span>
          ))}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{folder.name}</span>
        </nav>

        <div className="mb-8">
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

        {subfolders.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subfolders
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subfolders.map(
                (c) =>
                  c.shareToken && (
                    <Link
                      key={c.shareToken}
                      href={`/sf/${c.shareToken}`}
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
                        {c._count.documents} doc{c._count.documents === 1 ? "" : "s"}
                        {c._count.children > 0 &&
                          `, ${c._count.children} subfolder${c._count.children === 1 ? "" : "s"}`}
                      </p>
                    </Link>
                  ),
              )}
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
              <p className="text-sm text-muted-foreground">
                No public documents in this folder.
              </p>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {documents.map(
                (doc) =>
                  doc.shareToken && (
                    <li key={doc.shareToken}>
                      <Link
                        href={`/sd/${doc.shareToken}`}
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
                          {formatRemaining(
                            doc.expiresAt ? new Date(doc.expiresAt) : null,
                          )}
                        </span>
                      </Link>
                    </li>
                  ),
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
