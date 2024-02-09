-- AlterTable
ALTER TABLE "DailyChallengeResponse" ADD COLUMN     "completedOnTime" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0;
