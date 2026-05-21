import type { Visibility } from "@/features/document";

export interface FolderDto {
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  visibility: Visibility;
  shareToken: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  visibility: Visibility;
  shareToken: string | null;
  expiresAt: string | null;
  documentCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderViewDto {
  folder: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    parentId: string | null;
    visibility: Visibility;
    shareToken: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  breadcrumbs: Array<{ slug: string; name: string }>;
  subfolders: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    documentCount: number;
    childCount: number;
  }>;
  documents: Array<{
    slug: string;
    title: string | null;
    contentType: "MARKDOWN" | "HTML";
    visibility: Visibility;
    shareToken: string | null;
    expiresAt: string | null;
    viewCount: number;
    createdAt: string;
  }>;
}

export interface CreateFolderResponse {
  id: string;
  slug: string;
  name: string;
  editToken: string;
  visibility: Visibility;
  shareToken: string | null;
  shareUrl: string | null;
  editUrl: string;
}

export interface OwnedFolderRef {
  id: string;
  slug: string;
  editToken: string;
  name: string;
  createdAt: string;
}
