import { z } from "zod";

export const ttlPresetSchema = z.enum(["1h", "1d", "7d", "30d", "never"]);
export const contentTypeSchema = z.enum(["MARKDOWN", "HTML"]);

const MAX_CONTENT_SIZE = 256 * 1024;

export const createDocumentSchema = z.object({
  title: z.string().trim().max(120).optional(),
  contentType: contentTypeSchema,
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(MAX_CONTENT_SIZE, "Content exceeds 256 KB limit"),
  ttl: ttlPresetSchema,
  folderId: z.string().cuid().nullish(),
});

export const updateDocumentSchema = createDocumentSchema.partial().extend({
  content: z
    .string()
    .min(1)
    .max(MAX_CONTENT_SIZE)
    .optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
