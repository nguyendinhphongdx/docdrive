"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "next-themes";
import type { ContentType } from "../types";

interface EditorPaneProps {
  value: string;
  onChange: (v: string) => void;
  contentType: ContentType;
}

export function EditorPane({ value, onChange, contentType }: EditorPaneProps) {
  const { resolvedTheme } = useTheme();

  const extensions = useMemo(
    () => (contentType === "HTML" ? [html()] : [markdown()]),
    [contentType],
  );

  return (
    <div className="h-full overflow-auto bg-background">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={resolvedTheme === "dark" ? oneDark : "light"}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          foldGutter: true,
          autocompletion: false,
        }}
        height="100%"
        style={{ height: "100%", fontSize: "14px" }}
      />
    </div>
  );
}
