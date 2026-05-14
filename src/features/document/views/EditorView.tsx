"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FileText,
  LayoutDashboard,
  Loader2,
  LogIn,
  MoreHorizontal,
  Save,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { data: session, status } = useSession();
  const authed = !!session?.user && status === "authenticated";

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

  const [savedDoc, setSavedDoc] = useState<CreateDocumentResponse | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const isEdit = !!existingDocument;
  const saving = createDocument.isPending || updateDocument.isPending;
  const deleting = deleteDocument.isPending;

  const shareData: CreateDocumentResponse | null = savedDoc ?? (
    existingDocument && typeof window !== "undefined"
      ? {
          slug: existingDocument.slug,
          editToken: existingDocument.editToken,
          expiresAt: null,
          viewUrl: `${window.location.origin}/d/${existingDocument.slug}`,
          editUrl: `${window.location.origin}/editor/${existingDocument.slug}?token=${existingDocument.editToken}`,
        }
      : null
  );
  const canShare = !!shareData;

  const handleSave = () => {
    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }
    if (isEdit && existingDocument) {
      updateDocument.mutate(
        { title: title || undefined, contentType, content, folderId },
        {
          onSuccess: () => toast.success("Saved"),
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "Save failed"),
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
          setSavedDoc(data);
          toast.success("Saved");
          router.replace(`/editor/${data.slug}?token=${data.editToken}`);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to create document"),
      },
    );
  };

  const handleShare = () => {
    if (!canShare) return;
    setShareDialogOpen(true);
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
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <FileText className="h-4 w-4" />
          <span>docdrive</span>
        </Link>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          onClick={handleShare}
          disabled={!canShare || saving || deleting}
        >
          <Share2 className="mr-1 h-4 w-4" />
          Share
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving || deleting}>
          {saving ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-1 h-4 w-4" />
              Save
            </>
          )}
        </Button>
        {isEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={saving || deleting}>
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {authed ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-1 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              <LogIn className="mr-1 h-4 w-4" />
              Sign in
            </Link>
          </Button>
        )}
        <ThemeToggle />
      </header>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
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
          <DocumentSidebar mode={isEdit ? "edit" : "create"} folderPicker={folderPicker} />
        </div>
      </div>

      <DocumentCreatedDialog
        open={shareDialogOpen}
        data={shareData}
        onOpenChange={setShareDialogOpen}
        showEditUrl={!authed}
      />
    </div>
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
