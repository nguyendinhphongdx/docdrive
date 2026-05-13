// Single source of truth for site-wide metadata. Edit here, every page picks
// it up automatically through createMetadata() / sitemap / robots / JSON-LD.

export const SITE = {
  name: "docdrive",
  shortName: "docdrive",
  domain: "localhost",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Write. Preview. Share.",
  description:
    "A drive-like workspace for Markdown and HTML notes — with folders, live preview, and expiring share links.",
  locale: "en_US",
  twitter: "@example",
  github: "https://github.com/nguyendinhphongdx/docdrive",
  email: "hello@example.com",
  ogImage: "/opengraph-image",
} as const;

export const NAV_LINKS = [
  { href: "/editor", label: "New document" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
] as const;

export type SiteConfig = typeof SITE;
