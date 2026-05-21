"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Pencil, Share2, Trash2 } from "lucide-react";
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
import { ShareDialog } from "@/features/document/components/ShareDialog";
import type { Visibility } from "@/features/document";
import { useDeleteFolder, useUpdateFolder } from "../hooks/useFolders";
import {
  forgetOwnedFolder,
  useOwnedFolders,
} from "../hooks/useOwnedFolders";

interface FolderViewActionsProps {
  folderId: string;
  folderSlug: string;
  folderName: string;
  visibility: Visibility;
  shareToken: string | null;
  expiresAt: string | null;
}

export function FolderViewActions({
  folderId,
  folderSlug,
  folderName,
  visibility: initialVisibility,
  shareToken: initialShareToken,
  expiresAt: initialExpiresAt,
}: FolderViewActionsProps) {
  const router = useRouter();
  const params = useSearchParams();
  const owned = useOwnedFolders();
  const queryToken = params.get("token") ?? undefined;
  const ownedToken = owned.find((f) => f.id === folderId)?.editToken;
  const editToken = queryToken ?? ownedToken;

  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(folderName);
  const [shareOpen, setShareOpen] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt);

  const update = useUpdateFolder(folderSlug, editToken);
  const remove = useDeleteFolder(folderSlug, editToken);
  const isAnonymous = !!editToken && !ownedToken && !!queryToken
    ? true
    : !!ownedToken;

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

  const handleShareUpdate = (patch: {
    visibility?: Visibility;
    ttl?: import("@/features/document").TtlPreset;
  }) => {
    update.mutate(patch, {
      onSuccess: (data) => {
        setVisibility(data.visibility);
        setShareToken(data.shareToken);
        setExpiresAt(data.expiresAt);
        if (patch.visibility === "PUBLIC") toast.success("Share link generated");
        else if (patch.visibility === "PRIVATE") toast.success("Sharing stopped");
        else if (patch.ttl) toast.success("Expiration updated");
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to update"),
    });
  };

  const shareUrl =
    shareToken && typeof window !== "undefined"
      ? `${window.location.origin}/sf/${shareToken}`
      : null;
  const editUrl =
    queryToken && typeof window !== "undefined"
      ? `${window.location.origin}/f/${folderSlug}?token=${queryToken}`
      : null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
        <Share2 className="mr-1 h-4 w-4" />
        Share
      </Button>
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

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        itemKind="folder"
        visibility={visibility}
        shareUrl={shareUrl}
        editUrl={editUrl}
        expiresAt={expiresAt}
        isAnonymous={isAnonymous}
        onUpdate={handleShareUpdate}
        updating={update.isPending}
      />

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
