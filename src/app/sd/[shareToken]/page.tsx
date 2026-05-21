import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { Markdown, sanitizeHtml, formatRemaining } from "@/features/document";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { shareToken } = await params;
  const doc = await db.document.findUnique({
    where: { shareToken },
    select: { title: true, visibility: true },
  });
  if (!doc || doc.visibility !== "PUBLIC") {
    return createMetadata({ path: `/sd/${shareToken}`, title: "Not found" });
  }
  return createMetadata({
    path: `/sd/${shareToken}`,
    title: doc.title ?? "Shared document",
    description: "A markdown / HTML document shared with you.",
  });
}

export default async function PublicDocumentPage({ params }: PageProps) {
  const { shareToken } = await params;
  const doc = await db.document.findUnique({
    where: { shareToken },
    select: {
      title: true,
      contentType: true,
      content: true,
      visibility: true,
      expiresAt: true,
      viewCount: true,
      createdAt: true,
      folder: { select: { shareToken: true, name: true, visibility: true } },
    },
  });
  if (!doc || doc.visibility !== "PUBLIC") notFound();

  if (doc.expiresAt && doc.expiresAt <= new Date()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Clock className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">This share has expired</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The link you followed pointed to a document whose lifetime has ended.
          The content is no longer available.
        </p>
        <Button asChild>
          <Link href="/editor">Create a new document</Link>
        </Button>
      </div>
    );
  }

  // Fire-and-forget view counter.
  void db.document
    .update({ where: { shareToken }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const html = doc.contentType === "HTML" ? sanitizeHtml(doc.content) : null;
  const remaining = formatRemaining(doc.expiresAt);
  const parentLink =
    doc.folder?.visibility === "PUBLIC" && doc.folder?.shareToken
      ? { href: `/sf/${doc.folder.shareToken}`, name: doc.folder.name }
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
        <Button asChild variant="ghost" size="sm">
          <Link href={parentLink?.href ?? "/"}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {parentLink?.name ?? "Home"}
          </Link>
        </Button>
        <div className="flex-1 truncate text-sm font-medium">
          {doc.title ?? "Shared document"}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/editor">
            <Pencil className="mr-1 h-4 w-4" />
            New
          </Link>
        </Button>
        <ThemeToggle />
      </header>

      <main className="flex-1 px-4 py-6 sm:px-8">
        <article className="mx-auto max-w-3xl">
          {html ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none wrap-break-word"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <Markdown source={doc.content} />
          )}
        </article>
      </main>

      <footer className="border-t px-4 py-3 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
          <span>
            Created {new Date(doc.createdAt).toLocaleDateString()} ·{" "}
            {doc.viewCount + 1} view{doc.viewCount + 1 === 1 ? "" : "s"}
          </span>
          <span>{remaining}</span>
        </div>
      </footer>
    </div>
  );
}
