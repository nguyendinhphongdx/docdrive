-- AlterTable
ALTER TABLE "Folder" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Folder_expiresAt_idx" ON "Folder"("expiresAt");
