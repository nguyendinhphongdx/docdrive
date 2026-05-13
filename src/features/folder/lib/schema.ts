import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(80),
  description: z.string().trim().max(280).optional(),
  parentId: z.string().cuid().nullish(),
});

export const updateFolderSchema = createFolderSchema.partial();

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
