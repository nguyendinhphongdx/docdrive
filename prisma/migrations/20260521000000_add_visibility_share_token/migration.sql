-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
                       ADD COLUMN "shareToken" TEXT;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
                     ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Document_shareToken_key" ON "Document"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_shareToken_key" ON "Folder"("shareToken");
