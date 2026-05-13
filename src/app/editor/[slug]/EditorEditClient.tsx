"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { EditorView, useOwnedDocuments } from "@/features/document";
import { Button } from "@/components/ui/button";
import type { ContentType } from "@/features/document";
import { FolderPickerSlot } from "../FolderPickerSlot";

interface EditorEditClientProps {
  slug: string;
  title: string | null;
  contentType: ContentType;
  content: string;
  folderId: string | null;
}

export function EditorEditClient({
  slug,
  title,
  contentType,
  content,
  folderId,
}: EditorEditClientProps) {
  const params = useSearchParams();
  const queryToken = params.get("token") ?? undefined;
  const owned = useOwnedDocuments();
  const ownedToken = owned.find((d) => d.slug === slug)?.editToken;
  const editToken = queryToken ?? ownedToken;

  if (!editToken) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Edit token required</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          You need the original edit link to modify this document. If you
          created it on this browser, the token is stored locally — check that
          you&apos;re on the same device.
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/d/${slug}`}>View document</Link>
          </Button>
          <Button asChild>
            <Link href="/editor">Create new</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EditorView
      existingDocument={{
        slug,
        editToken,
        initialDraft: {
          title: title ?? "",
          contentType,
          content,
          ttl: "7d",
          folderId,
        },
      }}
      folderPicker={<FolderPickerSlot />}
    />
  );
}
