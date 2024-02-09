/*
  Warnings:

  - The primary key for the `UserDocumentPermission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `userDocumentPermissionID` was added to the `UserDocumentPermission` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "UserDocumentPermission" DROP CONSTRAINT "UserDocumentPermission_documentVersionID_fkey";

-- AlterTable
ALTER TABLE "UserDocumentPermission" DROP CONSTRAINT "UserDocumentPermission_pkey",
ADD COLUMN     "documentID" TEXT,
ADD COLUMN     "userDocumentPermissionID" TEXT NOT NULL,
ALTER COLUMN "documentVersionID" DROP NOT NULL,
ADD CONSTRAINT "UserDocumentPermission_pkey" PRIMARY KEY ("userDocumentPermissionID");

-- AddForeignKey
ALTER TABLE "UserDocumentPermission" ADD CONSTRAINT "UserDocumentPermission_documentVersionID_fkey" FOREIGN KEY ("documentVersionID") REFERENCES "DocumentVersion"("documentVersionID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentPermission" ADD CONSTRAINT "UserDocumentPermission_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE SET NULL ON UPDATE CASCADE;
