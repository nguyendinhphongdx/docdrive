import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { Markdown, sanitizeHtml, formatRemaining } from "@/features/document";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/seo";
import { ExpiredView } from "./expired/ExpiredView";
import { DocumentViewActions } from "./DocumentViewActions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const doc = await db.document.findUnique({
    where: { slug },
    select: { title: true, expiresAt: true },
  });
  if (!doc) return createMetadata({ path: `/d/${slug}`, title: "Not found" });
  if (doc.expiresAt && doc.expiresAt <= new Date()) {
    return createMetadata({ path: `/d/${slug}`, title: "Expired" });
  }
  return createMetadata({
    path: `/d/${slug}`,
    title: doc.title ?? "Shared document",
    description: "A markdown / HTML document shared with you.",
  });
}

export default async function DocumentViewPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await db.document.findUnique({
    where: { slug },
    include: {
      folder: { select: { slug: true, name: true } },
    },
  });
  if (!doc) notFound();

  if (doc.expiresAt && doc.expiresAt <= new Date()) {
    return <ExpiredView />;
  }

  void db.document
    .update({ where: { slug }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const html = doc.contentType === "HTML" ? sanitizeHtml(doc.content) : null;
  const remaining = formatRemaining(doc.expiresAt);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
        <Button asChild variant="ghost" size="sm">
          <Link href={doc.folder ? `/f/${doc.folder.slug}` : "/"}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {doc.folder ? doc.folder.name : "Home"}
          </Link>
        </Button>
        <div className="flex-1 truncate text-sm font-medium">
          {doc.title ?? "Shared document"}
        </div>
        <DocumentViewActions slug={slug} />
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
