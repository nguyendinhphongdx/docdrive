"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Markdown,
  sanitizeHtml,
  formatRemaining,
  type ContentType,
} from "@/features/document";
import { cn } from "@/lib/utils";

export type TreeNode =
  | {
      kind: "folder";
      shareToken: string;
      name: string;
      children: TreeNode[];
    }
  | {
      kind: "document";
      shareToken: string;
      title: string | null;
      contentType: ContentType;
      expiresAt: string | null;
      viewCount: number;
      createdAt: string;
    };

interface FolderShareViewProps {
  rootFolder: { name: string; description: string | null };
  breadcrumbs: Array<{ shareToken: string; name: string }>;
  tree: TreeNode[];
}

interface FetchedDoc {
  title: string | null;
  contentType: ContentType;
  content: string;
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
}

async function fetchSharedDoc(shareToken: string): Promise<FetchedDoc> {
  const res = await fetch(`/api/sd/${shareToken}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(res.status === 410 ? "Expired" : "Not found");
  }
  return (await res.json()) as FetchedDoc;
}

export function FolderShareView({
  rootFolder,
  breadcrumbs,
  tree,
}: FolderShareViewProps) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Home
          </Link>
        </Button>
        <div className="flex-1" />
        <ThemeToggle />
      </header>

      <ResizablePanelGroup
        orientation="horizontal"
        className="hidden flex-1 md:flex"
      >
        <ResizablePanel defaultSize={32} minSize={20} maxSize={50}>
          <TreePane
            rootFolder={rootFolder}
            breadcrumbs={breadcrumbs}
            tree={tree}
            selectedToken={selectedToken}
            onSelect={setSelectedToken}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={68} minSize={40}>
          <PreviewPane shareToken={selectedToken} />
        </ResizablePanel>
      </ResizablePanelGroup>

      <div className="flex flex-1 flex-col md:hidden">
        <TreePane
          rootFolder={rootFolder}
          breadcrumbs={breadcrumbs}
          tree={tree}
          selectedToken={selectedToken}
          onSelect={setSelectedToken}
        />
        {selectedToken && (
          <div className="border-t">
            <PreviewPane shareToken={selectedToken} />
          </div>
        )}
      </div>
    </div>
  );
}

interface TreePaneProps {
  rootFolder: { name: string; description: string | null };
  breadcrumbs: Array<{ shareToken: string; name: string }>;
  tree: TreeNode[];
  selectedToken: string | null;
  onSelect: (token: string) => void;
}

function TreePane({
  rootFolder,
  breadcrumbs,
  tree,
  selectedToken,
  onSelect,
}: TreePaneProps) {
  return (
    <div className="h-full overflow-y-auto px-3 py-4">
      <nav className="mb-3 flex flex-wrap items-center gap-1 px-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {breadcrumbs.map((b) => (
          <span key={b.shareToken} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <Link href={`/sf/${b.shareToken}`} className="hover:text-foreground">
              {b.name}
            </Link>
          </span>
        ))}
      </nav>

      <div className="mb-3 flex items-center gap-2 px-1">
        <FolderOpen className="h-5 w-5 text-amber-500" />
        <h1 className="truncate text-base font-semibold tracking-tight">
          {rootFolder.name}
        </h1>
      </div>
      {rootFolder.description && (
        <p className="mb-3 px-1 text-xs text-muted-foreground">
          {rootFolder.description}
        </p>
      )}

      {tree.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-xs text-muted-foreground">
          Nothing public in this folder.
        </div>
      ) : (
        <ul className="space-y-0.5">
          {tree.map((node, i) => (
            <TreeItem
              key={node.kind + node.shareToken + i}
              node={node}
              depth={0}
              selectedToken={selectedToken}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  selectedToken: string | null;
  onSelect: (token: string) => void;
}

function TreeItem({ node, depth, selectedToken, onSelect }: TreeItemProps) {
  if (node.kind === "folder") {
    return (
      <FolderTreeItem
        node={node}
        depth={depth}
        selectedToken={selectedToken}
        onSelect={onSelect}
      />
    );
  }
  return (
    <DocumentTreeItem
      node={node}
      depth={depth}
      selected={selectedToken === node.shareToken}
      onSelect={onSelect}
    />
  );
}

function FolderTreeItem({
  node,
  depth,
  selectedToken,
  onSelect,
}: {
  node: Extract<TreeNode, { kind: "folder" }>;
  depth: number;
  selectedToken: string | null;
  onSelect: (token: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left hover:bg-muted"
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-90",
            !hasChildren && "opacity-0",
          )}
        />
        <FolderIcon className="h-4 w-4 shrink-0 text-amber-500" />
        <span className="truncate text-sm">{node.name}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {node.children.length}
        </span>
      </button>
      {expanded && hasChildren && (
        <ul className="space-y-0.5">
          {node.children.map((c, i) => (
            <TreeItem
              key={c.kind + c.shareToken + i}
              node={c}
              depth={depth + 1}
              selectedToken={selectedToken}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function DocumentTreeItem({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: Extract<TreeNode, { kind: "document" }>;
  depth: number;
  selected: boolean;
  onSelect: (token: string) => void;
}) {
  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-1 pr-1 transition-colors",
          selected ? "bg-primary/10" : "hover:bg-muted",
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        <span className="w-3.5 shrink-0" />
        <button
          type="button"
          onClick={() => onSelect(node.shareToken)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <FileText
            className={cn(
              "h-4 w-4 shrink-0",
              selected ? "text-primary" : "text-muted-foreground",
            )}
          />
          <span className="truncate text-sm">
            {node.title ?? "Untitled"}
          </span>
        </button>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 opacity-0 group-hover:opacity-100",
            selected && "opacity-100",
          )}
        >
          <Link
            href={`/sd/${node.shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in new tab"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </li>
  );
}

function PreviewPane({ shareToken }: { shareToken: string | null }) {
  const query = useQuery({
    queryKey: ["share-doc", shareToken],
    queryFn: () => fetchSharedDoc(shareToken!),
    enabled: !!shareToken,
    staleTime: 30 * 1000,
  });

  if (!shareToken) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
        <FileText className="h-8 w-8" />
        <p className="text-sm">Pick a document to preview.</p>
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
        <p className="text-sm">
          Failed to load:{" "}
          {query.error instanceof Error ? query.error.message : "unknown error"}
        </p>
      </div>
    );
  }

  const doc = query.data;
  const html = doc.contentType === "HTML" ? sanitizeHtml(doc.content) : null;
  const remaining = formatRemaining(
    doc.expiresAt ? new Date(doc.expiresAt) : null,
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-muted/30 px-4">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 truncate text-sm font-medium">
          {doc.title ?? "Untitled"}
        </div>
        <span className="text-xs text-muted-foreground">{remaining}</span>
        <Button asChild variant="ghost" size="sm">
          <Link
            href={`/sd/${shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-1 h-4 w-4" />
            Open
          </Link>
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <article className="mx-auto max-w-3xl">
          {html ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none wrap-break-word"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <Markdown source={doc.content} />
          )}
        </article>
      </main>
    </div>
  );
}
