export interface FolderDto {
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
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
    createdAt: string;
    updatedAt: string;
  };
  breadcrumbs: Array<{ slug: string; name: string }>;
  children: Array<{
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
  viewUrl: string;
  editUrl: string;
}

export interface OwnedFolderRef {
  id: string;
  slug: string;
  editToken: string;
  name: string;
  createdAt: string;
}
