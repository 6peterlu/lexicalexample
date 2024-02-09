/*
  Warnings:

  - You are about to drop the column `notePercentage` on the `EnhancedDocument` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EnhancedDocument" DROP COLUMN "notePercentage",
ADD COLUMN     "draftCollapsed" BOOLEAN NOT NULL DEFAULT true;
