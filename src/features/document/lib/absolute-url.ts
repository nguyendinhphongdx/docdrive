import { headers } from "next/headers";

export async function getOrigin(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export function buildShareUrls(origin: string, slug: string, editToken: string) {
  return {
    viewUrl: `${origin}/s/${slug}`,
    editUrl: `${origin}/editor/${slug}?token=${editToken}`,
  };
}
