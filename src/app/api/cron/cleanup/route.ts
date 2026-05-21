import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const provided =
    req.headers.get("x-cron-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const [docs, folders] = await Promise.all([
    db.document.deleteMany({ where: { expiresAt: { lte: now } } }),
    db.folder.deleteMany({ where: { expiresAt: { lte: now } } }),
  ]);

  return NextResponse.json({ documents: docs.count, folders: folders.count });
}

export const GET = POST;
