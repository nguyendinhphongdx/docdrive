"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  FilePlus2,
  Folder as FolderIcon,
  FolderPlus,
  Home,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useDeleteFolder,
  useMyFolders,
  useUpdateFolder,
} from "../hooks/useFolders";
import { forgetOwnedFolder } from "../hooks/useOwnedFolders";
import type { FolderSummary } from "../types";
import { CreateFolderDialog } from "./CreateFolderDialog";

export interface SelectedFolder {
  id: string;
  name: string;
  slug: string;
}

interface FolderTreeProps {
  selectedId: string | null;
  onSelect: (folder: SelectedFolder | null) => void;
}

export function FolderTree({ selectedId, onSelect }: FolderTreeProps) {
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

  return (
    <ul className="space-y-0.5">
      <li>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            selectedId === null
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted",
          )}
        >
          <Home className="h-4 w-4" />
          <span className="flex-1 truncate text-left">My drive</span>
        </button>
      </li>
      {root.length === 0 ? (
        <li className="px-2 py-3 text-xs text-muted-foreground">
          No folders yet — create one to group documents.
        </li>
      ) : (
        root.map((f) => (
          <FolderNode
            key={f.id}
            folder={f}
            all={folders}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))
      )}
    </ul>
  );
}

interface NodeProps {
  folder: FolderSummary;
  all: FolderSummary[];
  depth: number;
  selectedId: string | null;
  onSelect: (folder: SelectedFolder | null) => void;
}

function FolderNode({ folder, all, depth, selectedId, onSelect }: NodeProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(depth < 1);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [creatingChild, setCreatingChild] = useState(false);
  const children = all.filter((f) => f.parentId === folder.id);
  const update = useUpdateFolder(folder.slug, undefined);
  const remove = useDeleteFolder(folder.slug, undefined);

  const isActive = selectedId === folder.id;
  const hasChildren = children.length > 0;

  const handleRowClick = () => {
    if (hasChildren) setExpanded((v) => !v);
    onSelect({ id: folder.id, name: folder.name, slug: folder.slug });
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    const next = newName.trim();
    if (!next || next === folder.name) {
      setRenaming(false);
      return;
    }
    update.mutate(
      { name: next },
      {
        onSuccess: () => {
          toast.success("Folder renamed");
          setRenaming(false);
          if (isActive) {
            onSelect({ id: folder.id, name: next, slug: folder.slug });
          }
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Rename failed"),
      },
    );
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        `Delete "${folder.name}"? Contained documents and subfolders will be orphaned (kept, but unfiled).`,
      )
    )
      return;
    remove.mutate(undefined, {
      onSuccess: () => {
        forgetOwnedFolder(folder.id);
        if (isActive) onSelect(null);
        toast.success("Folder deleted");
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
  };

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : expanded && hasChildren
              ? "bg-muted/60"
              : "hover:bg-muted",
        )}
        style={{ paddingLeft: `${depth * 16 + 2}px` }}
      >
        <button
          type="button"
          onClick={handleChevronClick}
          className={cn(
            "flex h-7 w-6 items-center justify-center",
            isActive ? "text-primary" : "text-muted-foreground",
          )}
          aria-label={expanded ? "Collapse" : "Expand"}
          tabIndex={-1}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              expanded && "rotate-90",
              !hasChildren && "opacity-0",
            )}
          />
        </button>
        <button
          type="button"
          onClick={handleRowClick}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-sm"
        >
          <FolderIcon
            className={cn(
              "h-4 w-4",
              isActive ? "text-primary" : "text-amber-500",
            )}
          />
          <span className="flex-1 truncate">{folder.name}</span>
          <span
            className={cn(
              "text-xs",
              isActive ? "text-primary/70" : "text-muted-foreground",
            )}
          >
            {folder.documentCount}
          </span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100",
                isActive && "opacity-100",
              )}
              aria-label="Folder actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setCreatingChild(true);
              }}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New folder
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => router.push(`/editor?folderId=${folder.id}`)}
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              New document
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setNewName(folder.name);
                setRenaming(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={remove.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && hasChildren && (
        <ul className="space-y-0.5">
          {children.map((c) => (
            <FolderNode
              key={c.id}
              folder={c}
              all={all}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRename} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Rename folder</DialogTitle>
              <DialogDescription>
                Pick a new name for &ldquo;{folder.name}&rdquo;.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`rename-${folder.id}`}>Name</Label>
              <Input
                id={`rename-${folder.id}`}
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={80}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateFolderDialog
        parentId={folder.id}
        open={creatingChild}
        onOpenChange={setCreatingChild}
        onCreated={() => {
          setExpanded(true);
        }}
      />
    </li>
  );
}
