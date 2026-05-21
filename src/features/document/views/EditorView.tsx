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
import { ShareDialog } from "../components/ShareDialog";
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
import type { DocumentDraft, TtlPreset, Visibility } from "../types";

interface ExistingDocument {
  slug: string;
  editToken: string;
  visibility: Visibility;
  shareToken: string | null;
  expiresAt: string | null;
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

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  // Live share-state: starts from the doc loaded server-side, mutates as the
  // owner toggles visibility (which also creates / clears shareToken).
  const [visibility, setVisibility] = useState<Visibility>(
    existingDocument?.visibility ?? "PRIVATE",
  );
  const [shareToken, setShareToken] = useState<string | null>(
    existingDocument?.shareToken ?? null,
  );
  const [currentExpiresAt, setCurrentExpiresAt] = useState<string | null>(
    existingDocument?.expiresAt ?? null,
  );
  // Track the latest slug + editToken so the dialog stays accurate after
  // anonymous create (which transitions us from no-slug into an existing doc).
  const [activeSlug, setActiveSlug] = useState<string | null>(
    existingDocument?.slug ?? null,
  );
  const [activeEditToken, setActiveEditToken] = useState<string | null>(
    existingDocument?.editToken ?? null,
  );

  const isEdit = !!existingDocument;
  const saving = createDocument.isPending || updateDocument.isPending;
  const deleting = deleteDocument.isPending;
  const togglingVisibility = updateDocument.isPending;
  // Share button is available as soon as a doc exists (either preloaded or
  // freshly created in this session).
  const canShare = !!activeSlug;

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
          // Only track for anonymous creators — authed users own the row in DB.
          if (!authed) {
            rememberOwnedDocument({
              slug: data.slug,
              editToken: data.editToken,
              title: title || null,
              createdAt: new Date().toISOString(),
            });
          }
          setActiveSlug(data.slug);
          setActiveEditToken(data.editToken);
          setVisibility(data.visibility);
          setShareToken(data.shareToken);
          setCurrentExpiresAt(data.expiresAt);
          if (!authed) {
            setShareDialogOpen(true);
          } else {
            toast.success("Saved");
          }
          router.replace(
            authed ? `/d/${data.slug}` : `/d/${data.slug}?token=${data.editToken}`,
          );
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

  const handleShareUpdate = (patch: {
    visibility?: Visibility;
    ttl?: TtlPreset;
  }) => {
    if (!activeSlug) return;
    updateDocument.mutate(patch, {
      onSuccess: (data) => {
        setVisibility(data.visibility);
        setShareToken(data.shareToken);
        setCurrentExpiresAt(data.expiresAt);
        if (patch.visibility === "PUBLIC") toast.success("Share link generated");
        else if (patch.visibility === "PRIVATE") toast.success("Sharing stopped");
        else if (patch.ttl) toast.success("Expiration updated");
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to update"),
    });
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
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setTimeout(handleDelete, 0);
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

      {activeSlug && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          itemKind="document"
          visibility={visibility}
          shareUrl={
            shareToken && typeof window !== "undefined"
              ? `${window.location.origin}/sd/${shareToken}`
              : null
          }
          editUrl={
            activeEditToken && typeof window !== "undefined"
              ? `${window.location.origin}/d/${activeSlug}?token=${activeEditToken}`
              : null
          }
          expiresAt={currentExpiresAt}
          isAnonymous={!authed}
          onUpdate={authed ? handleShareUpdate : undefined}
          updating={togglingVisibility}
        />
      )}
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
