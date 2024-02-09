/*
  Warnings:

  - You are about to drop the column `auth0ID` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_auth0ID_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "auth0ID";
