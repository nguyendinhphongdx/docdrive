"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ContentType, TtlPreset } from "./types";

interface DraftState {
  title: string;
  contentType: ContentType;
  content: string;
  ttl: TtlPreset;
  folderId: string | null;
  setTitle: (v: string) => void;
  setContentType: (v: ContentType) => void;
  setContent: (v: string) => void;
  setTtl: (v: TtlPreset) => void;
  setFolderId: (v: string | null) => void;
  reset: () => void;
  replace: (
    draft: Pick<
      DraftState,
      "title" | "contentType" | "content" | "ttl" | "folderId"
    >,
  ) => void;
}

const DEFAULT_CONTENT = `# Hello, docdrive

Type **Markdown** here. Live preview on the right.

- Toggle to **HTML** mode for raw HTML.
- Set an expiration time in the sidebar.
- Drop the document into a folder (optional).
- Click **Create document** when you're done.

\`\`\`js
console.log("share me!");
\`\`\`
`;

export const useDocumentDraft = create<DraftState>()(
  persist(
    (set) => ({
      title: "",
      contentType: "MARKDOWN",
      content: DEFAULT_CONTENT,
      ttl: "7d",
      folderId: null,
      setTitle: (title) => set({ title }),
      setContentType: (contentType) => set({ contentType }),
      setContent: (content) => set({ content }),
      setTtl: (ttl) => set({ ttl }),
      setFolderId: (folderId) => set({ folderId }),
      reset: () =>
        set({
          title: "",
          contentType: "MARKDOWN",
          content: DEFAULT_CONTENT,
          ttl: "7d",
          folderId: null,
        }),
      replace: (draft) => set(draft),
    }),
    {
      name: "docdrive:draft",
      partialize: (s) => ({
        title: s.title,
        contentType: s.contentType,
        content: s.content,
        ttl: s.ttl,
        folderId: s.folderId,
      }),
    },
  ),
);
