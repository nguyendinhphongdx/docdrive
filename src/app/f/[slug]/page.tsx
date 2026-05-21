import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/seo";
import { FolderView } from "@/features/folder/views/FolderView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
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
  return createMetadata({
    path: `/f/${slug}`,
    title: "Folder",
  });
}

export default async function OwnerFolderPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  const folder = await db.folder.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      parentId: true,
      visibility: true,
      shareToken: true,
      editToken: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!folder) notFound();

  let authorized = false;
  if (folder.ownerId) {
    const session = await auth();
    if (session?.user?.id === folder.ownerId) authorized = true;
  }
  if (!authorized && token && timingSafeEqual(folder.editToken, token)) {
    authorized = true;
  }
  if (!authorized) notFound();

  const [breadcrumbs, subfolders, documents] = await Promise.all([
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
        visibility: true,
        shareToken: true,
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
          <Link href="/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <div className="flex-1" />
        <ThemeToggle />
      </header>
      <FolderView
        folder={{
          id: folder.id,
          slug: folder.slug,
          name: folder.name,
          description: folder.description,
          parentId: folder.parentId,
          visibility: folder.visibility,
          shareToken: folder.shareToken,
          createdAt: folder.createdAt.toISOString(),
          updatedAt: folder.updatedAt.toISOString(),
        }}
        breadcrumbs={breadcrumbs}
        subfolders={subfolders.map((c) => ({
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
