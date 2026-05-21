import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

const claimItemSchema = z.object({
  kind: z.enum(["doc", "folder"]),
  slug: z.string().min(1).max(64),
  editToken: z.string().min(1).max(128),
});

const claimSchema = z.object({
  items: z.array(claimItemSchema).min(1).max(200),
});

interface ClaimResult {
  kind: "doc" | "folder";
  slug: string;
  status: "claimed" | "not_found" | "bad_token" | "already_owned";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const results: ClaimResult[] = [];

  for (const item of parsed.data.items) {
    const existing = item.kind === "doc"
      ? await db.document.findUnique({
          where: { slug: item.slug },
          select: { editToken: true, ownerId: true },
        })
      : await db.folder.findUnique({
          where: { slug: item.slug },
          select: { editToken: true, ownerId: true },
        });

    if (!existing) {
      results.push({ kind: item.kind, slug: item.slug, status: "not_found" });
      continue;
    }
    if (!timingSafeEqual(existing.editToken, item.editToken)) {
      results.push({ kind: item.kind, slug: item.slug, status: "bad_token" });
      continue;
    }
    if (existing.ownerId && existing.ownerId !== userId) {
      results.push({ kind: item.kind, slug: item.slug, status: "already_owned" });
      continue;
    }

    if (item.kind === "doc") {
      await db.document.update({
        where: { slug: item.slug },
        data: { ownerId: userId },
      });
    } else {
      await db.folder.update({
        where: { slug: item.slug },
        data: { ownerId: userId },
      });
    }
    results.push({ kind: item.kind, slug: item.slug, status: "claimed" });
  }

  return NextResponse.json({ results });
}
