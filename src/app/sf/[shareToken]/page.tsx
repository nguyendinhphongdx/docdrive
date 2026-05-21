import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { createMetadata } from "@/lib/seo";
import {
  FolderShareView,
  type TreeNode,
} from "@/features/folder/views/FolderShareView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

const MAX_DEPTH = 8;

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

async function fetchSubtree(folderId: string, depth: number): Promise<TreeNode[]> {
  if (depth >= MAX_DEPTH) return [];

  const [subfolders, docs] = await Promise.all([
    db.folder.findMany({
      where: { parentId: folderId, visibility: "PUBLIC" },
      orderBy: { name: "asc" },
      select: { id: true, shareToken: true, name: true },
    }),
    db.document.findMany({
      where: {
        folderId,
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

  const folderNodes: TreeNode[] = await Promise.all(
    subfolders
      .filter((f): f is typeof f & { shareToken: string } => !!f.shareToken)
      .map(async (f) => ({
        kind: "folder" as const,
        shareToken: f.shareToken,
        name: f.name,
        children: await fetchSubtree(f.id, depth + 1),
      })),
  );

  const docNodes: TreeNode[] = docs
    .filter((d): d is typeof d & { shareToken: string } => !!d.shareToken)
    .map((d) => ({
      kind: "document" as const,
      shareToken: d.shareToken,
      title: d.title,
      contentType: d.contentType,
      expiresAt: d.expiresAt?.toISOString() ?? null,
      viewCount: d.viewCount,
      createdAt: d.createdAt.toISOString(),
    }));

  return [...folderNodes, ...docNodes];
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

  const [breadcrumbs, tree] = await Promise.all([
    buildBreadcrumbs(folder.parentId),
    fetchSubtree(folder.id, 0),
  ]);

  return (
    <FolderShareView
      rootFolder={{ name: folder.name, description: folder.description }}
      breadcrumbs={breadcrumbs}
      tree={tree}
    />
  );
}
