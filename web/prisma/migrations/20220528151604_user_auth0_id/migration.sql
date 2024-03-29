/*
  Warnings:

  - A unique constraint covering the columns `[auth0ID]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `auth0ID` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "auth0ID" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0ID_key" ON "User"("auth0ID");
