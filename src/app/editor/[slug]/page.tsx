import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { createMetadata } from "@/lib/seo";
import { ExpiredView } from "../../d/[slug]/expired/ExpiredView";
import { EditorEditClient } from "./EditorEditClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return createMetadata({
    path: `/editor/${slug}`,
    title: "Edit document",
  });
}

export default async function EditDocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await db.document.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      contentType: true,
      content: true,
      folderId: true,
      expiresAt: true,
    },
  });

  if (!doc) notFound();
  if (doc.expiresAt && doc.expiresAt <= new Date()) {
    return <ExpiredView />;
  }

  return (
    <EditorEditClient
      slug={doc.slug}
      title={doc.title}
      contentType={doc.contentType}
      content={doc.content}
      folderId={doc.folderId}
    />
  );
}
