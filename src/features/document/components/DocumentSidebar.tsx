"use client";

import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentDraft } from "../store";
import { TTL_OPTIONS } from "../lib/ttl";
import type { ContentType, TtlPreset } from "../types";

interface DocumentSidebarProps {
  mode: "create" | "edit";
  onSubmit: () => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  folderPicker?: React.ReactNode;
}

export function DocumentSidebar({
  mode,
  onSubmit,
  onDelete,
  isSubmitting = false,
  folderPicker,
}: DocumentSidebarProps) {
  const title = useDocumentDraft((s) => s.title);
  const contentType = useDocumentDraft((s) => s.contentType);
  const ttl = useDocumentDraft((s) => s.ttl);
  const setTitle = useDocumentDraft((s) => s.setTitle);
  const setContentType = useDocumentDraft((s) => s.setContentType);
  const setTtl = useDocumentDraft((s) => s.setTtl);

  const submitLabel = mode === "edit" ? "Save changes" : "Create document";
  const submittingLabel = mode === "edit" ? "Saving…" : "Creating…";

  return (
    <aside className="flex h-full w-full flex-col gap-5 bg-muted/30 p-5">
      <div className="space-y-2">
        <Label htmlFor="doc-title">Title (optional)</Label>
        <Input
          id="doc-title"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled document"
        />
      </div>

      <div className="space-y-2">
        <Label>Format</Label>
        <Tabs
          value={contentType}
          onValueChange={(v) => setContentType(v as ContentType)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="MARKDOWN">Markdown</TabsTrigger>
            <TabsTrigger value="HTML">HTML</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {folderPicker}

      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="doc-ttl">Expiration</Label>
          <Select value={ttl} onValueChange={(v) => setTtl(v as TtlPreset)}>
            <SelectTrigger id="doc-ttl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TTL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex-1" />

      <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submittingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>

      {mode === "edit" && onDelete && (
        <Button
          onClick={onDelete}
          disabled={isSubmitting}
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete document
        </Button>
      )}
    </aside>
  );
}
