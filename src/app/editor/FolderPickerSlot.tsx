"use client";

import { useSession } from "next-auth/react";
import { useDocumentDraft } from "@/features/document";
import { FolderPicker } from "@/features/folder";

export function FolderPickerSlot() {
  const { status } = useSession();
  const folderId = useDocumentDraft((s) => s.folderId);
  const setFolderId = useDocumentDraft((s) => s.setFolderId);

  return (
    <FolderPicker
      value={folderId}
      onChange={setFolderId}
      authed={status === "authenticated"}
    />
  );
}
