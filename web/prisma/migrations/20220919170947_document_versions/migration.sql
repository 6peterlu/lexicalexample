/*
  Warnings:

  - You are about to drop the column `documentID` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Document` table. All the data in the column will be lost.
  - The primary key for the `UserDocumentPermission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `documentID` on the `UserDocumentPermission` table. All the data in the column will be lost.
  - Added the required column `documentVersionID` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentVersionID` to the `UserDocumentPermission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_documentID_fkey";

-- DropForeignKey
ALTER TABLE "UserDocumentPermission" DROP CONSTRAINT "UserDocumentPermission_documentID_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "documentID",
ADD COLUMN     "documentVersionID" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "content";

-- AlterTable
ALTER TABLE "UserDocumentPermission" DROP CONSTRAINT "UserDocumentPermission_pkey",
DROP COLUMN "documentID",
ADD COLUMN     "documentVersionID" TEXT NOT NULL,
ADD CONSTRAINT "UserDocumentPermission_pkey" PRIMARY KEY ("userID", "documentVersionID");

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "documentVersionID" TEXT NOT NULL,
    "content" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentID" TEXT NOT NULL,
    "versionName" TEXT,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("documentVersionID")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_versionName_key" ON "DocumentVersion"("versionName");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentID_versionName_idx" ON "DocumentVersion"("documentID", "versionName");

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_documentVersionID_fkey" FOREIGN KEY ("documentVersionID") REFERENCES "DocumentVersion"("documentVersionID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentPermission" ADD CONSTRAINT "UserDocumentPermission_documentVersionID_fkey" FOREIGN KEY ("documentVersionID") REFERENCES "DocumentVersion"("documentVersionID") ON DELETE RESTRICT ON UPDATE CASCADE;
