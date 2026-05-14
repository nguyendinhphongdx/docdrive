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

## Code

\`\`\`js
console.log("share me!");
\`\`\`

## Math

Inline: $E = mc^2$, and a block:

$$
\\int_0^1 x^2\\,dx = \\frac{1}{3}
$$

## Mermaid

\`\`\`mermaid
flowchart LR
  Editor -->|create| API
  API --> DB[(Postgres)]
  API -->|share link| Viewer
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
