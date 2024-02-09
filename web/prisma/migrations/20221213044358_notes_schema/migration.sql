/*
  Warnings:

  - You are about to drop the column `userID` on the `Note` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_userID_fkey";

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "userID",
ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserDocumentPermission" ADD COLUMN     "noteID" TEXT;

-- AddForeignKey
ALTER TABLE "UserDocumentPermission" ADD CONSTRAINT "UserDocumentPermission_noteID_fkey" FOREIGN KEY ("noteID") REFERENCES "Note"("noteID") ON DELETE CASCADE ON UPDATE CASCADE;
