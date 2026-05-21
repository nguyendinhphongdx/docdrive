import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ shareToken: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { shareToken } = await ctx.params;
  const doc = await db.document.findUnique({
    where: { shareToken },
    select: {
      title: true,
      contentType: true,
      content: true,
      visibility: true,
      expiresAt: true,
      viewCount: true,
      createdAt: true,
    },
  });

  if (!doc || doc.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.expiresAt && doc.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  // Fire-and-forget view counter bump.
  void db.document
    .update({ where: { shareToken }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return NextResponse.json({
    title: doc.title,
    contentType: doc.contentType,
    content: doc.content,
    expiresAt: doc.expiresAt?.toISOString() ?? null,
    viewCount: doc.viewCount + 1,
    createdAt: doc.createdAt.toISOString(),
  });
}
