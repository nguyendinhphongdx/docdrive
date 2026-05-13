"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { folderService } from "../services/folderService";
import type {
  CreateFolderInput,
  UpdateFolderInput,
} from "../lib/schema";

export const folderKeys = {
  all: ["folders"] as const,
  detail: (slug: string) => ["folders", slug] as const,
  ownList: (parentId?: string | null) =>
    parentId === undefined
      ? (["folders", "mine"] as const)
      : (["folders", "mine", parentId ?? "_root"] as const),
};

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFolderInput) => folderService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders", "mine"] });
    },
  });
}

export function useUpdateFolder(slug: string, editToken: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateFolderInput) =>
      folderService.update(slug, editToken, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.detail(slug) });
      qc.invalidateQueries({ queryKey: ["folders", "mine"] });
    },
  });
}

export function useDeleteFolder(slug: string, editToken: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => folderService.remove(slug, editToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders", "mine"] });
    },
  });
}

export function useMyFolders(parentId?: string | null) {
  return useQuery({
    queryKey: folderKeys.ownList(parentId),
    queryFn: () => folderService.listMine(parentId),
    staleTime: 30 * 1000,
  });
}
