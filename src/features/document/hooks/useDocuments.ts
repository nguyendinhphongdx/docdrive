"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentService } from "../services/documentService";
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "../lib/schema";

export const documentKeys = {
  all: ["documents"] as const,
  detail: (slug: string) => ["documents", slug] as const,
  ownList: (folderId?: string | null) =>
    folderId === undefined
      ? (["documents", "mine"] as const)
      : (["documents", "mine", folderId ?? "_root"] as const),
};

export function useCreateDocument() {
  return useMutation({
    mutationFn: (input: CreateDocumentInput) => documentService.create(input),
  });
}

export function useUpdateDocument(slug: string, editToken: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDocumentInput) =>
      documentService.update(slug, editToken, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.detail(slug) });
      qc.invalidateQueries({ queryKey: ["documents", "mine"] });
    },
  });
}

export function useDeleteDocument(slug: string, editToken: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => documentService.remove(slug, editToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", "mine"] });
    },
  });
}

export function useMyDocuments(folderId?: string | null) {
  return useQuery({
    queryKey: documentKeys.ownList(folderId),
    queryFn: () => documentService.listMine(folderId),
    staleTime: 30 * 1000,
  });
}
