/*
  Warnings:

  - Added the required column `selectedText` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "selectedText" TEXT NOT NULL;
