/*
  Warnings:

  - You are about to drop the column `noteID` on the `UserDocumentPermission` table. All the data in the column will be lost.
  - Added the required column `documentID` to the `Note` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NoteRole" AS ENUM ('OWNER', 'EDITOR');

-- DropForeignKey
ALTER TABLE "UserDocumentPermission" DROP CONSTRAINT "UserDocumentPermission_noteID_fkey";

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "documentID" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserDocumentPermission" DROP COLUMN "noteID";

-- CreateTable
CREATE TABLE "UserNotePermission" (
    "userNotePermissionID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "role" "NoteRole" NOT NULL,
    "noteID" TEXT NOT NULL,

    CONSTRAINT "UserNotePermission_pkey" PRIMARY KEY ("userNotePermissionID")
);

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotePermission" ADD CONSTRAINT "UserNotePermission_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotePermission" ADD CONSTRAINT "UserNotePermission_noteID_fkey" FOREIGN KEY ("noteID") REFERENCES "Note"("noteID") ON DELETE CASCADE ON UPDATE CASCADE;
