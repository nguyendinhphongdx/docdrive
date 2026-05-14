"use client";

import { Streamdown } from "streamdown";

interface MarkdownProps {
  source: string;
}

export function Markdown({ source }: MarkdownProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
      <Streamdown>{source}</Streamdown>
    </div>
  );
}
