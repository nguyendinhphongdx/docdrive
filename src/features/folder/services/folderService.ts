import type {
  CreateFolderInput,
  UpdateFolderInput,
} from "../lib/schema";
import type {
  CreateFolderResponse,
  FolderSummary,
  FolderViewDto,
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

export const folderService = {
  create: async (input: CreateFolderInput): Promise<CreateFolderResponse> => {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(input),
    });
    return handle(res);
  },

  get: async (slug: string): Promise<FolderViewDto> => {
    const res = await fetch(`/api/folders/${slug}`, { cache: "no-store" });
    return handle(res);
  },

  listMine: async (parentId?: string | null): Promise<{ folders: FolderSummary[] }> => {
    const qs =
      parentId === undefined
        ? ""
        : parentId === null
          ? "?parentId=null"
          : `?parentId=${encodeURIComponent(parentId)}`;
    const res = await fetch(`/api/folders${qs}`, { cache: "no-store" });
    return handle(res);
  },

  update: async (
    slug: string,
    editToken: string | undefined,
    input: UpdateFolderInput,
  ): Promise<{
    slug: string;
    name: string;
    visibility: "PRIVATE" | "PUBLIC";
    shareToken: string | null;
  }> => {
    const res = await fetch(`/api/folders/${slug}`, {
      method: "PATCH",
      headers: buildHeaders(editToken),
      body: JSON.stringify(input),
    });
    return handle(res);
  },

  remove: async (
    slug: string,
    editToken: string | undefined,
  ): Promise<{ ok: true }> => {
    const res = await fetch(`/api/folders/${slug}`, {
      method: "DELETE",
      headers: buildHeaders(editToken),
    });
    return handle(res);
  },
};
