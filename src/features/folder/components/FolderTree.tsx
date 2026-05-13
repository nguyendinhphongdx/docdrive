"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronRight,
  Folder as FolderIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteFolder, useMyFolders } from "../hooks/useFolders";
import type { FolderSummary } from "../types";

export function FolderTree() {
  const { data, isLoading, error } = useMyFolders(undefined);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading folders…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2 text-sm text-destructive">
        Failed to load folders.
      </div>
    );
  }

  const folders = data?.folders ?? [];
  const root = folders.filter((f) => !f.parentId);

  if (root.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-muted-foreground">
        No folders yet — create one to group documents.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {root.map((f) => (
        <FolderNode key={f.id} folder={f} all={folders} depth={0} />
      ))}
    </ul>
  );
}

interface NodeProps {
  folder: FolderSummary;
  all: FolderSummary[];
  depth: number;
}

function FolderNode({ folder, all, depth }: NodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const children = all.filter((f) => f.parentId === folder.id);
  const remove = useDeleteFolder(folder.slug, undefined);

  const handleDelete = () => {
    if (
      !window.confirm(
        `Delete "${folder.name}"? Contained documents and subfolders will be orphaned (kept, but unfiled).`,
      )
    )
      return;
    remove.mutate(undefined, {
      onSuccess: () => toast.success("Folder deleted"),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
  };

  return (
    <li>
      <div
        className="group flex items-center gap-1 rounded-md py-1 pr-1 hover:bg-muted"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex h-6 w-6 items-center justify-center text-muted-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${
              expanded ? "rotate-90" : ""
            } ${children.length === 0 ? "opacity-0" : ""}`}
          />
        </button>
        <Link
          href={`/f/${folder.slug}`}
          className="flex flex-1 items-center gap-2 truncate text-sm"
        >
          <FolderIcon className="h-4 w-4 text-amber-500" />
          <span className="truncate">{folder.name}</span>
          <span className="text-xs text-muted-foreground">
            {folder.documentCount}
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/f/${folder.slug}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Open
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && children.length > 0 && (
        <ul>
          {children.map((c) => (
            <FolderNode key={c.id} folder={c} all={all} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
