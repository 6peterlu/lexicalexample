/*
  Warnings:

  - The primary key for the `PublishedDocument` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[documentID,userID]` on the table `PublishedDocument` will be added. If there are existing duplicate values, this will fail.
  - The required column `publishedDocumentID` was added to the `PublishedDocument` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
ALTER TABLE "PublishedDocument" DROP CONSTRAINT "PublishedDocument_pkey",
ADD COLUMN     "publishedDocumentID" TEXT NOT NULL DEFAULT uuid_generate_v4(),
ADD CONSTRAINT "PublishedDocument_pkey" PRIMARY KEY ("publishedDocumentID");

-- CreateTable
CREATE TABLE "_likes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_likes_AB_unique" ON "_likes"("A", "B");

-- CreateIndex
CREATE INDEX "_likes_B_index" ON "_likes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedDocument_documentID_userID_key" ON "PublishedDocument"("documentID", "userID");

-- AddForeignKey
ALTER TABLE "_likes" ADD CONSTRAINT "_likes_A_fkey" FOREIGN KEY ("A") REFERENCES "PublishedDocument"("publishedDocumentID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_likes" ADD CONSTRAINT "_likes_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;
