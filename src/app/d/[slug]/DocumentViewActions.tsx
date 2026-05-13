"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOwnedDocuments } from "@/features/document";

export function DocumentViewActions({ slug }: { slug: string }) {
  const docs = useOwnedDocuments();
  const editToken = docs.find((d) => d.slug === slug)?.editToken;

  if (!editToken) return null;

  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/editor/${slug}?token=${editToken}`}>
        <Pencil className="mr-1 h-4 w-4" />
        Edit
      </Link>
    </Button>
  );
}
