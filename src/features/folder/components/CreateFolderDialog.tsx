"use client";

import { useState } from "react";
import { Loader2, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateFolder } from "../hooks/useFolders";
import { rememberOwnedFolder } from "../hooks/useOwnedFolders";

interface CreateFolderDialogProps {
  parentId?: string | null;
  trigger?: React.ReactNode;
  onCreated?: (folder: { id: string; slug: string; name: string }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateFolderDialog({
  parentId = null,
  trigger,
  onCreated,
  open: controlledOpen,
  onOpenChange,
}: CreateFolderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next);
    else setInternalOpen(next);
  };
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateFolder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        parentId: parentId ?? undefined,
      },
      {
        onSuccess: (data) => {
          rememberOwnedFolder({
            id: data.id,
            slug: data.slug,
            editToken: data.editToken,
            name: data.name,
            createdAt: new Date().toISOString(),
          });
          toast.success("Folder created");
          setName("");
          setDescription("");
          setOpen(false);
          onCreated?.(data);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to create folder"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm">
              <FolderPlus className="mr-1 h-4 w-4" />
              New folder
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Group documents together and share a single link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="folder-description">Description (optional)</Label>
            <Textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
