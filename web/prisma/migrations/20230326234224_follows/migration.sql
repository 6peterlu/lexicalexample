/*
  Warnings:

  - You are about to drop the column `contactID` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_contactID_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "contactID";

-- CreateTable
CREATE TABLE "Follows" (
    "followerID" TEXT NOT NULL,
    "followingID" TEXT NOT NULL,

    CONSTRAINT "Follows_pkey" PRIMARY KEY ("followerID","followingID")
);

-- AddForeignKey
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_followerID_fkey" FOREIGN KEY ("followerID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_followingID_fkey" FOREIGN KEY ("followingID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;
