/*
  Warnings:

  - You are about to drop the `StatUnit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StatUnit" DROP CONSTRAINT "StatUnit_documentID_fkey";

-- DropForeignKey
ALTER TABLE "StatUnit" DROP CONSTRAINT "StatUnit_documentVersionID_fkey";

-- DropForeignKey
ALTER TABLE "StatUnit" DROP CONSTRAINT "StatUnit_userID_fkey";

-- DropTable
DROP TABLE "StatUnit";

-- CreateTable
CREATE TABLE "DailyStatUnit" (
    "statUnitID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "documentVersionID" TEXT,
    "documentID" TEXT,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "wordsAdded" INTEGER NOT NULL DEFAULT 0,
    "wordsRemoved" INTEGER NOT NULL DEFAULT 0,
    "dailyChallengeCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DailyStatUnit_pkey" PRIMARY KEY ("statUnitID")
);

-- AddForeignKey
ALTER TABLE "DailyStatUnit" ADD CONSTRAINT "DailyStatUnit_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStatUnit" ADD CONSTRAINT "DailyStatUnit_documentVersionID_fkey" FOREIGN KEY ("documentVersionID") REFERENCES "DocumentVersion"("documentVersionID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStatUnit" ADD CONSTRAINT "DailyStatUnit_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE SET NULL ON UPDATE CASCADE;
