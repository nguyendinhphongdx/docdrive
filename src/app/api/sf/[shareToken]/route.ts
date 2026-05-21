import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

interface RouteContext {
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
    // Only include ancestors that are themselves PUBLIC (visible to recipient).
    if (node.visibility === "PUBLIC" && node.shareToken) {
      trail.unshift({ shareToken: node.shareToken, name: node.name });
    }
    current = node.parentId;
    safety += 1;
  }
  return trail;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { shareToken } = await ctx.params;

  const folder = await db.folder.findUnique({
    where: { shareToken },
    select: {
      id: true,
      name: true,
      description: true,
      parentId: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!folder || folder.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  return NextResponse.json({
    folder: {
      name: folder.name,
      description: folder.description,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    },
    breadcrumbs,
    subfolders: subfolders
      .filter((c): c is typeof c & { shareToken: string } => !!c.shareToken)
      .map((c) => ({
        shareToken: c.shareToken,
        name: c.name,
        description: c.description,
        documentCount: c._count.documents,
        childCount: c._count.children,
      })),
    documents: documents
      .filter((d): d is typeof d & { shareToken: string } => !!d.shareToken)
      .map((d) => ({
        shareToken: d.shareToken,
        title: d.title,
        contentType: d.contentType,
        expiresAt: d.expiresAt?.toISOString() ?? null,
        viewCount: d.viewCount,
        createdAt: d.createdAt.toISOString(),
      })),
  });
}
