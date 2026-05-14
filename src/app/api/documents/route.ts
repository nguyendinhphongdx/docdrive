import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createDocumentSchema } from "@/features/document/lib/schema";
import { generateSlug } from "@/features/document/lib/slug";
import { computeExpiresAt } from "@/features/document/lib/ttl";
import {
  buildDocumentUrls,
  getOrigin,
} from "@/features/document/lib/absolute-url";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { title, contentType, content, ttl, folderId } = parsed.data;

  const session = await auth();
  const ownerId = session?.user?.id ?? null;

  // If folderId is provided, ensure caller may use it: must own the folder
  // (logged-in) or supply a folder edit-token via header. Keeps anonymous
  // documents from being silently injected into other people's folders.
  if (folderId) {
    const folder = await db.folder.findUnique({
      where: { id: folderId },
      select: { id: true, ownerId: true, editToken: true },
    });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
    const folderToken = req.headers.get("x-folder-token");
    const ownsFolder = ownerId && folder.ownerId === ownerId;
    const tokenMatch =
      folderToken && folderToken.length === folder.editToken.length &&
      folderToken === folder.editToken;
    if (!ownsFolder && !tokenMatch) {
      return NextResponse.json(
        { error: "Cannot write to this folder" },
        { status: 403 },
      );
    }
  }

  const slug = generateSlug();
  const editToken = randomBytes(32).toString("hex");
  const expiresAt = computeExpiresAt(ttl);

  const created = await db.document.create({
    data: {
      slug,
      title: title?.length ? title : null,
      contentType,
      content,
      editToken,
      expiresAt,
      ownerId,
      folderId: folderId ?? null,
    },
    select: { slug: true, expiresAt: true },
  });

  const origin = await getOrigin();
  const urls = buildDocumentUrls(origin, created.slug, editToken);

  return NextResponse.json(
    {
      slug: created.slug,
      editToken,
      expiresAt: created.expiresAt?.toISOString() ?? null,
      ...urls,
    },
    { status: 201 },
  );
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folderIdRaw = req.nextUrl.searchParams.get("folderId");
  const where: { ownerId: string; folderId?: string | null } = {
    ownerId: session.user.id,
  };
  if (folderIdRaw === "null") {
    where.folderId = null;
  } else if (folderIdRaw) {
    where.folderId = folderIdRaw;
  }

  const documents = await db.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      title: true,
      contentType: true,
      folderId: true,
      expiresAt: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    documents: documents.map((d) => ({
      ...d,
      expiresAt: d.expiresAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  });
}
