import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { EditorView } from "@/features/document";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/seo";
import { FolderPickerSlot } from "../../editor/FolderPickerSlot";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return createMetadata({
    path: `/d/${slug}`,
    title: "Edit document",
  });
}

export default async function OwnerDocumentPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

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
    },
  });
  if (!doc) notFound();

  let authorized = false;
  if (doc.ownerId) {
    const session = await auth();
    if (session?.user?.id === doc.ownerId) authorized = true;
  }
  if (!authorized && token && timingSafeEqual(doc.editToken, token)) {
    authorized = true;
  }
  if (!authorized) notFound();

  // Expired owner doc: still let owner see banner but skip editor render.
  if (doc.expiresAt && doc.expiresAt <= new Date()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Clock className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">This document has expired</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The TTL ran out and the content was scheduled for removal. Create a
          new document to start over.
        </p>
        <Button asChild>
          <Link href="/editor">New document</Link>
        </Button>
      </div>
    );
  }

  return (
    <EditorView
      existingDocument={{
        slug: doc.slug,
        editToken: doc.editToken,
        initialDraft: {
          title: doc.title ?? "",
          contentType: doc.contentType,
          content: doc.content,
          ttl: "7d",
          folderId: doc.folderId,
        },
      }}
      folderPicker={<FolderPickerSlot />}
    />
  );
}
