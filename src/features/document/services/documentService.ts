import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "../lib/schema";
import type {
  CreateDocumentResponse,
  ContentType,
  DocumentDto,
  Visibility,
} from "../types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  return (await res.json()) as T;
}

function buildHeaders(editToken?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (editToken) h["x-edit-token"] = editToken;
  return h;
}

export interface DocumentSummary {
  slug: string;
  title: string | null;
  contentType: ContentType;
  folderId: string | null;
  visibility: Visibility;
  shareToken: string | null;
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export const documentService = {
  create: async (input: CreateDocumentInput): Promise<CreateDocumentResponse> => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(input),
    });
    return handle<CreateDocumentResponse>(res);
  },

  get: async (slug: string): Promise<DocumentDto> => {
    const res = await fetch(`/api/documents/${slug}`, { cache: "no-store" });
    return handle<DocumentDto>(res);
  },

  listMine: async (folderId?: string | null): Promise<{ documents: DocumentSummary[] }> => {
    const qs =
      folderId === undefined
        ? ""
        : folderId === null
          ? "?folderId=null"
          : `?folderId=${encodeURIComponent(folderId)}`;
    const res = await fetch(`/api/documents${qs}`, { cache: "no-store" });
    return handle(res);
  },

  update: async (
    slug: string,
    editToken: string | undefined,
    input: UpdateDocumentInput,
  ): Promise<DocumentDto> => {
    const res = await fetch(`/api/documents/${slug}`, {
      method: "PATCH",
      headers: buildHeaders(editToken),
      body: JSON.stringify(input),
    });
    return handle<DocumentDto>(res);
  },

  remove: async (
    slug: string,
    editToken: string | undefined,
  ): Promise<{ ok: true }> => {
    const res = await fetch(`/api/documents/${slug}`, {
      method: "DELETE",
      headers: buildHeaders(editToken),
    });
    return handle<{ ok: true }>(res);
  },
};
