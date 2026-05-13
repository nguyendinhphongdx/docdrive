export type ContentType = "MARKDOWN" | "HTML";

export type TtlPreset = "1h" | "1d" | "7d" | "30d" | "never";

export interface DocumentDraft {
  title: string;
  contentType: ContentType;
  content: string;
  ttl: TtlPreset;
  folderId: string | null;
}

export interface DocumentDto {
  slug: string;
  title: string | null;
  contentType: ContentType;
  content: string;
  folderId: string | null;
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentResponse {
  slug: string;
  editToken: string;
  viewUrl: string;
  editUrl: string;
  expiresAt: string | null;
}

export interface OwnedDocumentRef {
  slug: string;
  editToken: string;
  title: string | null;
  createdAt: string;
}
