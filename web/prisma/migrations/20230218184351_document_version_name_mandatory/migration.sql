/*
  Warnings:

  - Made the column `versionName` on table `DocumentVersion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DocumentVersion" ALTER COLUMN "versionName" SET NOT NULL;
