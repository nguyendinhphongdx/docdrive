import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateDocumentSchema } from "@/features/document/lib/schema";

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

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;
  const doc = await db.document.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      contentType: true,
      content: true,
      folderId: true,
      expiresAt: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.expiresAt && doc.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  return NextResponse.json({
    ...doc,
    expiresAt: doc.expiresAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
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

  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await db.document.findUnique({
    where: { slug },
    select: { editToken: true, ownerId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await canMutate(existing, token))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, contentType, content, folderId } = parsed.data;
  const updated = await db.document.update({
    where: { slug },
    data: {
      ...(title !== undefined ? { title: title?.length ? title : null } : {}),
      ...(contentType !== undefined ? { contentType } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(folderId !== undefined ? { folderId } : {}),
    },
    select: {
      slug: true,
      title: true,
      contentType: true,
      content: true,
      folderId: true,
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
  const token = req.headers.get("x-edit-token");

  const existing = await db.document.findUnique({
    where: { slug },
    select: { editToken: true, ownerId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await canMutate(existing, token))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.document.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
