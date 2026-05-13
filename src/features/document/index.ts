export { EditorView } from "./views/EditorView";
export { DashboardView } from "./views/DashboardView";
export { useDocumentDraft } from "./store";
export { TTL_OPTIONS, computeExpiresAt, formatRemaining } from "./lib/ttl";
export { generateSlug } from "./lib/slug";
export { sanitizeHtml } from "./lib/sanitize";
export { Markdown } from "./lib/render-markdown";
export {
  createDocumentSchema,
  updateDocumentSchema,
  contentTypeSchema,
  ttlPresetSchema,
} from "./lib/schema";
export type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "./lib/schema";
export type {
  ContentType,
  TtlPreset,
  DocumentDraft,
  DocumentDto,
  CreateDocumentResponse,
  OwnedDocumentRef,
} from "./types";
export { documentService } from "./services/documentService";
export type { DocumentSummary } from "./services/documentService";
export {
  documentKeys,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useMyDocuments,
} from "./hooks/useDocuments";
export {
  useOwnedDocuments,
  rememberOwnedDocument,
  forgetOwnedDocument,
  getOwnedDocumentToken,
} from "./hooks/useOwnedDocuments";
export { DocumentsTable } from "./components/DocumentsTable";
