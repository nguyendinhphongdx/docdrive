import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/seo";
import { FolderView } from "@/features/folder/views/FolderView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function buildBreadcrumbs(
  parentId: string | null,
): Promise<Array<{ slug: string; name: string }>> {
  const trail: Array<{ slug: string; name: string }> = [];
  let current = parentId;
  let safety = 0;
  while (current && safety < 12) {
    const node: { slug: string; name: string; parentId: string | null } | null =
      await db.folder.findUnique({
        where: { id: current },
        select: { slug: true, name: true, parentId: true },
      });
    if (!node) break;
    trail.unshift({ slug: node.slug, name: node.name });
    current = node.parentId;
    safety += 1;
  }
  return trail;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const folder = await db.folder.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!folder) {
    return createMetadata({ path: `/f/${slug}`, title: "Folder not found" });
  }
  return createMetadata({
    path: `/f/${slug}`,
    title: folder.name,
    description: folder.description ?? "A folder of shared documents.",
  });
}

export default async function FolderPage({ params }: PageProps) {
  const { slug } = await params;

  const folder = await db.folder.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!folder) notFound();

  const [breadcrumbs, children, documents] = await Promise.all([
    buildBreadcrumbs(folder.parentId),
    db.folder.findMany({
      where: { parentId: folder.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        _count: { select: { documents: true, children: true } },
      },
    }),
    db.document.findMany({
      where: {
        folderId: folder.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        slug: true,
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
      <FolderView
        folder={{
          ...folder,
          createdAt: folder.createdAt.toISOString(),
          updatedAt: folder.updatedAt.toISOString(),
        }}
        breadcrumbs={breadcrumbs}
        subfolders={children.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          documentCount: c._count.documents,
          childCount: c._count.children,
        }))}
        documents={documents.map((d) => ({
          ...d,
          expiresAt: d.expiresAt?.toISOString() ?? null,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
