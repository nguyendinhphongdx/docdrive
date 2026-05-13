import { EditorView } from "@/features/document";
import { createMetadata } from "@/lib/seo";
import { EditorTopBar } from "./EditorTopBar";
import { EditorCreateClient } from "./EditorCreateClient";
import { FolderPickerSlot } from "./FolderPickerSlot";

export const metadata = createMetadata({
  path: "/editor",
  title: "New document",
  description: "Write Markdown or HTML with live preview, then share it.",
});

interface PageProps {
  searchParams: Promise<{ folderId?: string }>;
}

export default async function EditorPage({ searchParams }: PageProps) {
  const { folderId } = await searchParams;
  return (
    <div className="flex h-screen flex-col">
      <EditorTopBar />
      <EditorCreateClient initialFolderId={folderId ?? null}>
        <EditorView folderPicker={<FolderPickerSlot />} />
      </EditorCreateClient>
    </div>
  );
}
