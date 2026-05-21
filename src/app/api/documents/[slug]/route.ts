import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateDocumentSchema } from "@/features/document/lib/schema";
import { computeExpiresAt } from "@/features/document/lib/ttl";

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

/**
 * Owner-only access. Public reads go through /api/sd/[shareToken].
 * Returns 404 (not 403) for non-owners to avoid leaking existence.
 */
async function authorize(
  req: NextRequest,
  existing: { editToken: string; ownerId: string | null },
): Promise<boolean> {
  const providedToken = req.headers.get("x-edit-token");
  if (providedToken && timingSafeEqual(existing.editToken, providedToken)) {
    return true;
  }
  if (existing.ownerId) {
    const session = await auth();
    if (session?.user?.id === existing.ownerId) return true;
  }
  return false;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;
  const doc = await db.document.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      contentType: true,
      content: true,
      folderId: true,
      visibility: true,
      shareToken: true,
      editToken: true,
      ownerId: true,
      expiresAt: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await authorize(req, doc))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.expiresAt && doc.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  return NextResponse.json({
    slug: doc.slug,
    title: doc.title,
    contentType: doc.contentType,
    content: doc.content,
    folderId: doc.folderId,
    visibility: doc.visibility,
    shareToken: doc.shareToken,
    expiresAt: doc.expiresAt?.toISOString() ?? null,
    viewCount: doc.viewCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  });
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await db.document.findUnique({
    where: { slug },
    select: { editToken: true, ownerId: true, shareToken: true, visibility: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await authorize(req, existing))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { title, contentType, content, folderId, visibility, ttl } = parsed.data;

  // Visibility toggle: generate or clear shareToken.
  let nextShareToken = existing.shareToken;
  if (visibility === "PUBLIC" && !existing.shareToken) {
    nextShareToken = randomBytes(16).toString("hex");
  } else if (visibility === "PRIVATE") {
    nextShareToken = null;
  }

  // TTL update: recompute expiresAt from preset. `ttl: "never"` → null.
  const nextExpiresAt = ttl !== undefined ? computeExpiresAt(ttl) : undefined;

  const updated = await db.document.update({
    where: { slug },
    data: {
      ...(title !== undefined ? { title: title?.length ? title : null } : {}),
      ...(contentType !== undefined ? { contentType } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(folderId !== undefined ? { folderId: folderId ?? null } : {}),
      ...(visibility !== undefined
        ? { visibility, shareToken: nextShareToken }
        : {}),
      ...(nextExpiresAt !== undefined ? { expiresAt: nextExpiresAt } : {}),
    },
    select: {
      slug: true,
      title: true,
      contentType: true,
      content: true,
      folderId: true,
      visibility: true,
      shareToken: true,
      expiresAt: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ...updated,
    expiresAt: updated.expiresAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;

  const existing = await db.document.findUnique({
    where: { slug },
    select: { editToken: true, ownerId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await authorize(req, existing))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.document.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
