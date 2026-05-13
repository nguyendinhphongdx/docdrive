"use client";

import { useEffect } from "react";
import { useDocumentDraft } from "@/features/document";

interface EditorCreateClientProps {
  initialFolderId: string | null;
  children: React.ReactNode;
}

export function EditorCreateClient({
  initialFolderId,
  children,
}: EditorCreateClientProps) {
  const setFolderId = useDocumentDraft((s) => s.setFolderId);

  useEffect(() => {
    if (initialFolderId) {
      setFolderId(initialFolderId);
    }
  }, [initialFolderId, setFolderId]);

  return <>{children}</>;
}
