import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateFolderSchema } from "@/features/folder/lib/schema";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function canMutate(
  existing: { editToken: string; ownerId: string | null },
  providedToken: string | null,
): Promise<boolean> {
  if (providedToken && timingSafeEqual(existing.editToken, providedToken)) {
    return true;
  }
  if (existing.ownerId) {
    const session = await auth();
    if (session?.user?.id === existing.ownerId) return true;
  }
  return false;
}

async function buildBreadcrumbs(
  folderId: string,
): Promise<Array<{ slug: string; name: string }>> {
  const trail: Array<{ slug: string; name: string }> = [];
  let current: string | null = folderId;
  let safety = 0;
  while (current && safety < 12) {
    const node: { slug: string; name: string; parentId: string | null } | null = await db.folder.findUnique({
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

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;

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
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [breadcrumbs, children, documents] = await Promise.all([
    folder.parentId ? buildBreadcrumbs(folder.parentId) : Promise.resolve([]),
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

  return NextResponse.json({
    folder: {
      ...folder,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    },
    breadcrumbs,
    children: children.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      documentCount: c._count.documents,
      childCount: c._count.children,
    })),
    documents: documents.map((d) => ({
      ...d,
      expiresAt: d.expiresAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;
  const token = req.headers.get("x-edit-token");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await db.folder.findUnique({
    where: { slug },
    select: { id: true, editToken: true, ownerId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await canMutate(existing, token))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, parentId } = parsed.data;

  // Prevent setting a folder as its own ancestor.
  if (parentId !== undefined && parentId) {
    if (parentId === existing.id) {
      return NextResponse.json(
        { error: "A folder cannot contain itself" },
        { status: 400 },
      );
    }
    let cursor: string | null = parentId;
    while (cursor) {
      if (cursor === existing.id) {
        return NextResponse.json(
          { error: "Cycle detected in folder hierarchy" },
          { status: 400 },
        );
      }
      const node: { parentId: string | null } | null = await db.folder.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = node?.parentId ?? null;
    }
  }

  const updated = await db.folder.update({
    where: { slug },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined
        ? { description: description?.length ? description : null }
        : {}),
      ...(parentId !== undefined ? { parentId } : {}),
    },
    select: { slug: true, name: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;
  const token = req.headers.get("x-edit-token");

  const existing = await db.folder.findUnique({
    where: { slug },
    select: { editToken: true, ownerId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await canMutate(existing, token))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Soft delete: children + documents become orphans (onDelete: SetNull).
  await db.folder.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
