/*
  Warnings:

  - Added the required column `updatedAt` to the `WritingSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PublishedDocument" ALTER COLUMN "publishedDocumentID" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WritingSession" ADD COLUMN     "inProgress" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
