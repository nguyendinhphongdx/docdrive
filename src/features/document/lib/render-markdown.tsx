"use client";

import type { AnchorHTMLAttributes } from "react";
import { Streamdown, type Components, type ExtraProps } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import rehypeSlug from "rehype-slug";

interface MarkdownProps {
  source: string;
}

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps;

function MarkdownLink({ href, children, node, ...props }: AnchorProps) {
  void node;
  const isInternal =
    typeof href === "string" &&
    (href.startsWith("#") ||
      href.startsWith("/") ||
      href.startsWith("./") ||
      href.startsWith("../"));

  if (isInternal) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

const components: Components = { a: MarkdownLink };

export function Markdown({ source }: MarkdownProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word scroll-pt-20">
      <Streamdown
        plugins={{ code, mermaid, math }}
        rehypePlugins={[rehypeSlug]}
        components={components}
      >
        {source}
      </Streamdown>
    </div>
  );
}
