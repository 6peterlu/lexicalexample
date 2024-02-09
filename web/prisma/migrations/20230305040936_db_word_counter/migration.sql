-- AlterTable
ALTER TABLE "DailyChallengeResponse" ADD COLUMN     "wordCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "wordCount" INTEGER NOT NULL DEFAULT 0;
