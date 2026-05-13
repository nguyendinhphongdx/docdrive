"use client";

import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyFolders } from "../hooks/useFolders";
import { CreateFolderDialog } from "./CreateFolderDialog";

interface FolderPickerProps {
  value: string | null;
  onChange: (folderId: string | null) => void;
  authed: boolean;
}

const ROOT_VALUE = "__root__";

export function FolderPicker({ value, onChange, authed }: FolderPickerProps) {
  const { data, isLoading } = useMyFolders(undefined);
  const folders = data?.folders ?? [];

  if (!authed) {
    return (
      <div className="space-y-2">
        <Label>Folder</Label>
        <p className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Sign in to organize documents into folders.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="folder-picker">Folder</Label>
        <CreateFolderDialog
          trigger={
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
            >
              + New
            </button>
          }
          onCreated={(folder) => onChange(folder.id)}
        />
      </div>
      <Select
        value={value ?? ROOT_VALUE}
        onValueChange={(v) => onChange(v === ROOT_VALUE ? null : v)}
      >
        <SelectTrigger id="folder-picker">
          <SelectValue>
            {isLoading ? (
              <span className="flex items-center text-muted-foreground">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Loading…
              </span>
            ) : (
              folders.find((f) => f.id === value)?.name ?? "My documents (root)"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ROOT_VALUE}>My documents (root)</SelectItem>
          {folders.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
