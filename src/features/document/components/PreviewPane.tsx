"use client";

import { useMemo } from "react";
import { Markdown } from "../lib/render-markdown";
import { sanitizeHtml } from "../lib/sanitize";
import type { ContentType } from "../types";

interface PreviewPaneProps {
  content: string;
  contentType: ContentType;
}

export function PreviewPane({ content, contentType }: PreviewPaneProps) {
  const safeHtml = useMemo(
    () => (contentType === "HTML" ? sanitizeHtml(content) : ""),
    [content, contentType],
  );

  return (
    <div className="h-full overflow-auto bg-background px-6 py-4">
      {contentType === "HTML" ? (
        <div
          className="prose prose-sm dark:prose-invert max-w-none wrap-break-word"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <Markdown source={content} />
      )}
    </div>
  );
}
