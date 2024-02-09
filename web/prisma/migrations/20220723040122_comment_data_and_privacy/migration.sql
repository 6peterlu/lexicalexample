/*
  Warnings:

  - You are about to drop the column `commentText` on the `Comment` table. All the data in the column will be lost.
  - Added the required column `commentData` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `private` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "commentText",
ADD COLUMN     "commentData" JSONB NOT NULL,
ADD COLUMN     "private" BOOLEAN NOT NULL;
