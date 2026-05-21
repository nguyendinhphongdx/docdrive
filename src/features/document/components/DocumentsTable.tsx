"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRemaining } from "../lib/ttl";
import { useDeleteDocument, useMyDocuments } from "../hooks/useDocuments";

interface DocumentsTableProps {
  folderId?: string | null;
}

export function DocumentsTable({ folderId }: DocumentsTableProps = {}) {
  const { data, isLoading, error } = useMyDocuments(folderId);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading documents…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load documents: {error instanceof Error ? error.message : "unknown error"}
      </div>
    );
  }

  const documents = data?.documents ?? [];
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {folderId
            ? "This folder is empty."
            : "You haven’t created any documents yet."}
        </p>
        <Button asChild>
          <Link href={folderId ? `/editor?folderId=${folderId}` : "/editor"}>
            <Plus className="mr-1 h-4 w-4" />
            New document
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead className="w-24">Type</TableHead>
          <TableHead className="w-24 text-right">Views</TableHead>
          <TableHead className="w-40">Expires</TableHead>
          <TableHead className="w-32">Created</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <DocumentRow
            key={doc.slug}
            doc={doc}
            isPending={pendingSlug === doc.slug}
            onPendingChange={setPendingSlug}
          />
        ))}
      </TableBody>
    </Table>
  );
}

interface RowProps {
  doc: NonNullable<ReturnType<typeof useMyDocuments>["data"]>["documents"][number];
  isPending: boolean;
  onPendingChange: (slug: string | null) => void;
}

function DocumentRow({ doc, isPending, onPendingChange }: RowProps) {
  const remove = useDeleteDocument(doc.slug, undefined);

  const handleDelete = () => {
    if (!window.confirm("Delete this document permanently?")) return;
    onPendingChange(doc.slug);
    remove.mutate(undefined, {
      onSuccess: () => toast.success("Document deleted"),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed"),
      onSettled: () => onPendingChange(null),
    });
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link href={`/d/${doc.slug}`} className="hover:underline">
          {doc.title ?? "Untitled"}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-[10px] uppercase">
          {doc.contentType}
        </Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {doc.viewCount}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatRemaining(doc.expiresAt ? new Date(doc.expiresAt) : null)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(doc.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem asChild>
              <Link href={`/d/${doc.slug}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Open
              </Link>
            </DropdownMenuItem>
            {doc.shareToken && (
              <DropdownMenuItem asChild>
                <Link
                  href={`/sd/${doc.shareToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Open share link
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                setTimeout(handleDelete, 0);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
