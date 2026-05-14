"use client";

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";

interface MarkdownProps {
  source: string;
}

export function Markdown({ source }: MarkdownProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
      <Streamdown plugins={{ code, mermaid, math }}>{source}</Streamdown>
    </div>
  );
}
