import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createFolderSchema } from "@/features/folder/lib/schema";
import { generateSlug } from "@/features/document/lib/slug";
import {
  buildFolderEditUrl,
  buildFolderShareUrl,
  getOrigin,
} from "@/features/document/lib/absolute-url";

export const runtime = "nodejs";

const MAX_DEPTH = 10;

async function depthOf(folderId: string): Promise<number> {
  let depth = 0;
  let current: string | null = folderId;
  while (current && depth < MAX_DEPTH + 1) {
    const parent: { parentId: string | null } | null = await db.folder.findUnique({
      where: { id: current },
      select: { parentId: true },
    });
    if (!parent?.parentId) break;
    current = parent.parentId;
    depth += 1;
  }
  return depth;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { name, description, parentId } = parsed.data;

  const session = await auth();
  const ownerId = session?.user?.id ?? null;
  const isAnonymous = ownerId === null;

  if (parentId) {
    const parent = await db.folder.findUnique({
      where: { id: parentId },
      select: { ownerId: true, editToken: true },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
    }
    const parentToken = req.headers.get("x-parent-token");
    const ownsParent = ownerId && parent.ownerId === ownerId;
    const tokenMatch =
      parentToken && parentToken.length === parent.editToken.length &&
      parentToken === parent.editToken;
    if (!ownsParent && !tokenMatch) {
      return NextResponse.json(
        { error: "Cannot create folder under this parent" },
        { status: 403 },
      );
    }
    const depth = await depthOf(parentId);
    if (depth + 1 >= MAX_DEPTH) {
      return NextResponse.json(
        { error: `Folder nesting limit (${MAX_DEPTH}) reached` },
        { status: 400 },
      );
    }
  }

  const slug = generateSlug();
  const editToken = randomBytes(32).toString("hex");
  const visibility = isAnonymous ? "PUBLIC" : "PRIVATE";
  const shareToken = isAnonymous ? randomBytes(16).toString("hex") : null;

  const created = await db.folder.create({
    data: {
      slug,
      name,
      description: description?.length ? description : null,
      parentId: parentId ?? null,
      editToken,
      ownerId,
      visibility,
      shareToken,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      visibility: true,
      shareToken: true,
    },
  });

  const origin = await getOrigin();
  return NextResponse.json(
    {
      id: created.id,
      slug: created.slug,
      name: created.name,
      editToken,
      visibility: created.visibility,
      shareToken: created.shareToken,
      shareUrl: created.shareToken
        ? buildFolderShareUrl(origin, created.shareToken)
        : null,
      editUrl: buildFolderEditUrl(origin, created.slug, editToken),
    },
    { status: 201 },
  );
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parentIdRaw = req.nextUrl.searchParams.get("parentId");
  const where: { ownerId: string; parentId?: string | null } = {
    ownerId: session.user.id,
  };
  if (parentIdRaw === "null") {
    where.parentId = null;
  } else if (parentIdRaw) {
    where.parentId = parentIdRaw;
  }

  const folders = await db.folder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      parentId: true,
      visibility: true,
      shareToken: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { documents: true, children: true },
      },
    },
  });

  return NextResponse.json({
    folders: folders.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      description: f.description,
      parentId: f.parentId,
      visibility: f.visibility,
      shareToken: f.shareToken,
      documentCount: f._count.documents,
      childCount: f._count.children,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })),
  });
}
