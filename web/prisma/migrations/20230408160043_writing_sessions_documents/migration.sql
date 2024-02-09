/*
  Warnings:

  - You are about to drop the column `documentVersionID` on the `WritingSession` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "WritingSession" DROP CONSTRAINT "WritingSession_documentVersionID_fkey";

-- AlterTable
ALTER TABLE "WritingSession" DROP COLUMN "documentVersionID",
ADD COLUMN     "documentID" TEXT;

-- AddForeignKey
ALTER TABLE "WritingSession" ADD CONSTRAINT "WritingSession_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "DocumentVersion"("documentVersionID") ON DELETE SET NULL ON UPDATE CASCADE;
