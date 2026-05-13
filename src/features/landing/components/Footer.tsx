import Link from "next/link";
import { FileText } from "lucide-react";

import { SITE } from "@/lib/seo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "New share", href: "/editor" },
      { label: "Features", href: "#features" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Sign up", href: "/register" },
      { label: "My shares", href: "/dashboard" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 py-14 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight">
                {SITE.name}
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {SITE.description}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 md:col-span-7 md:gap-6">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Open source, MIT licensed.
          </p>
          <p className="flex items-center gap-1.5">
            <span>Built with</span>
            <span className="font-medium text-foreground">Next.js</span>
            <span>·</span>
            <span className="font-medium text-foreground">Tailwind</span>
            <span>·</span>
            <span className="font-medium text-foreground">shadcn/ui</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
