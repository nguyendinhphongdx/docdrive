"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteFolder, useUpdateFolder } from "../hooks/useFolders";
import {
  forgetOwnedFolder,
  useOwnedFolders,
} from "../hooks/useOwnedFolders";

interface FolderViewActionsProps {
  folderId: string;
  folderSlug: string;
  folderName: string;
}

export function FolderViewActions({
  folderId,
  folderSlug,
  folderName,
}: FolderViewActionsProps) {
  const router = useRouter();
  const params = useSearchParams();
  const owned = useOwnedFolders();
  const queryToken = params.get("token") ?? undefined;
  const ownedToken = owned.find((f) => f.id === folderId)?.editToken;
  const editToken = queryToken ?? ownedToken;

  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(folderName);

  const update = useUpdateFolder(folderSlug, editToken);
  const remove = useDeleteFolder(folderSlug, editToken);

  if (!editToken) return null;

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName === folderName) {
      setRenaming(false);
      return;
    }
    update.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => {
          toast.success("Folder renamed");
          setRenaming(false);
          router.refresh();
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Rename failed"),
      },
    );
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        `Delete "${folderName}"? Documents and subfolders are kept but become unfiled.`,
      )
    )
      return;
    remove.mutate(undefined, {
      onSuccess: () => {
        forgetOwnedFolder(folderId);
        toast.success("Folder deleted");
        router.push("/dashboard");
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setRenaming(true)}>
        <Pencil className="mr-1 h-4 w-4" />
        Rename
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={remove.isPending}
        className="text-destructive hover:text-destructive"
      >
        {remove.isPending ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="mr-1 h-4 w-4" />
        )}
        Delete
      </Button>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRename} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Rename folder</DialogTitle>
              <DialogDescription>
                Pick a new name for this folder.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="folder-rename">Name</Label>
              <Input
                id="folder-rename"
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
    </>
  );
}
