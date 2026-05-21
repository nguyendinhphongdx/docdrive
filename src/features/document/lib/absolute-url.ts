import { headers } from "next/headers";

export async function getOrigin(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export function buildDocumentEditUrl(
  origin: string,
  slug: string,
  editToken: string,
): string {
  return `${origin}/d/${slug}?token=${editToken}`;
}

export function buildDocumentShareUrl(
  origin: string,
  shareToken: string,
): string {
  return `${origin}/sd/${shareToken}`;
}

export function buildFolderEditUrl(
  origin: string,
  slug: string,
  editToken: string,
): string {
  return `${origin}/f/${slug}?token=${editToken}`;
}

export function buildFolderShareUrl(
  origin: string,
  shareToken: string,
): string {
  return `${origin}/sf/${shareToken}`;
}
