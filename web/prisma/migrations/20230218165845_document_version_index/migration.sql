/*
  Warnings:

  - You are about to drop the column `head` on the `DocumentVersion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "dvIndex" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DocumentVersion" DROP COLUMN "head";
