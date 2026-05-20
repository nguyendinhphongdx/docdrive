"use client";

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import rehypeSlug from "rehype-slug";

interface MarkdownProps {
  source: string;
}

export function Markdown({ source }: MarkdownProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word scroll-pt-20">
      <Streamdown plugins={{ code, mermaid, math }} rehypePlugins={[rehypeSlug]}>
        {source}
      </Streamdown>
    </div>
  );
}
