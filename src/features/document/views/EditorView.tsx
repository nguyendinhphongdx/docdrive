"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { EditorPane } from "../components/EditorPane";
import { PreviewPane } from "../components/PreviewPane";
import { DocumentSidebar } from "../components/DocumentSidebar";
import { DocumentCreatedDialog } from "../components/DocumentCreatedDialog";
import { useDocumentDraft } from "../store";
import {
  useCreateDocument,
  useDeleteDocument,
  useUpdateDocument,
} from "../hooks/useDocuments";
import {
  forgetOwnedDocument,
  rememberOwnedDocument,
} from "../hooks/useOwnedDocuments";
import type { CreateDocumentResponse, DocumentDraft } from "../types";

interface ExistingDocument {
  slug: string;
  editToken: string;
  initialDraft: DocumentDraft;
}

interface EditorViewProps {
  existingDocument?: ExistingDocument;
  folderPicker?: React.ReactNode;
}

export function EditorView({ existingDocument, folderPicker }: EditorViewProps) {
  const router = useRouter();
  const title = useDocumentDraft((s) => s.title);
  const content = useDocumentDraft((s) => s.content);
  const contentType = useDocumentDraft((s) => s.contentType);
  const ttl = useDocumentDraft((s) => s.ttl);
  const folderId = useDocumentDraft((s) => s.folderId);
  const setContent = useDocumentDraft((s) => s.setContent);
  const replace = useDocumentDraft((s) => s.replace);
  const reset = useDocumentDraft((s) => s.reset);

  const [hydratedSlug, setHydratedSlug] = useState<string | null>(null);
  if (existingDocument && hydratedSlug !== existingDocument.slug) {
    setHydratedSlug(existingDocument.slug);
    replace(existingDocument.initialDraft);
  }
  useEffect(() => {
    return () => {
      if (existingDocument) reset();
    };
  }, [existingDocument, reset]);

  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument(
    existingDocument?.slug ?? "",
    existingDocument?.editToken ?? "",
  );
  const deleteDocument = useDeleteDocument(
    existingDocument?.slug ?? "",
    existingDocument?.editToken ?? "",
  );
  const [result, setResult] = useState<CreateDocumentResponse | null>(null);

  const isEdit = !!existingDocument;
  const submitting =
    createDocument.isPending || updateDocument.isPending || deleteDocument.isPending;

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }
    if (isEdit && existingDocument) {
      updateDocument.mutate(
        { title: title || undefined, contentType, content, folderId },
        {
          onSuccess: () => {
            toast.success("Document updated");
            router.push(`/d/${existingDocument.slug}`);
          },
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "Update failed"),
        },
      );
      return;
    }
    createDocument.mutate(
      { title: title || undefined, contentType, content, ttl, folderId },
      {
        onSuccess: (data) => {
          rememberOwnedDocument({
            slug: data.slug,
            editToken: data.editToken,
            title: title || null,
            createdAt: new Date().toISOString(),
          });
          setResult(data);
          reset();
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to create document"),
      },
    );
  };

  const handleDelete = () => {
    if (!existingDocument) return;
    if (!window.confirm("Delete this document permanently?")) return;
    deleteDocument.mutate(undefined, {
      onSuccess: () => {
        forgetOwnedDocument(existingDocument.slug);
        toast.success("Document deleted");
        router.push("/");
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
  };

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col md:flex-row">
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 hidden md:flex"
        >
          <ResizablePanel defaultSize={50} minSize={25}>
            <EditorPane
              value={content}
              onChange={setContent}
              contentType={contentType}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={25}>
            <PreviewPane content={content} contentType={contentType} />
          </ResizablePanel>
        </ResizablePanelGroup>

        <div className="flex-1 md:hidden">
          <MobileEditPreview />
        </div>

        <div className="w-full md:w-80 shrink-0 border-t md:border-l md:border-t-0">
          <DocumentSidebar
            mode={isEdit ? "edit" : "create"}
            onSubmit={handleSubmit}
            onDelete={isEdit ? handleDelete : undefined}
            isSubmitting={submitting}
            folderPicker={folderPicker}
          />
        </div>
      </div>

      <DocumentCreatedDialog
        open={!!result}
        data={result}
        onOpenChange={(o) => !o && setResult(null)}
        showEditUrl
      />
    </>
  );
}

function MobileEditPreview() {
  const content = useDocumentDraft((s) => s.content);
  const contentType = useDocumentDraft((s) => s.contentType);
  const setContent = useDocumentDraft((s) => s.setContent);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 border-b">
        <button
          type="button"
          onClick={() => setTab("edit")}
          className={`flex-1 py-2 text-sm font-medium ${
            tab === "edit"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`flex-1 py-2 text-sm font-medium ${
            tab === "preview"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Preview
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === "edit" ? (
          <EditorPane
            value={content}
            onChange={setContent}
            contentType={contentType}
          />
        ) : (
          <PreviewPane content={content} contentType={contentType} />
        )}
      </div>
    </div>
  );
}
