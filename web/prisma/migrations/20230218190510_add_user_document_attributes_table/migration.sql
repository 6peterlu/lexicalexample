/*
  Warnings:

  - You are about to drop the column `dvIndex` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "dvIndex";

-- CreateTable
CREATE TABLE "UserDocumentAttributes" (
    "documentID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "lastOpenedDocumentVersionID" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDocumentAttributes_documentID_userID_key" ON "UserDocumentAttributes"("documentID", "userID");

-- AddForeignKey
ALTER TABLE "UserDocumentAttributes" ADD CONSTRAINT "UserDocumentAttributes_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentAttributes" ADD CONSTRAINT "UserDocumentAttributes_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentAttributes" ADD CONSTRAINT "UserDocumentAttributes_lastOpenedDocumentVersionID_fkey" FOREIGN KEY ("lastOpenedDocumentVersionID") REFERENCES "DocumentVersion"("documentVersionID") ON DELETE CASCADE ON UPDATE CASCADE;
