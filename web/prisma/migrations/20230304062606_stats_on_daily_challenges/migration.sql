/*
  Warnings:

  - A unique constraint covering the columns `[date,dailyChallengeResponseID]` on the table `DailyStatUnit` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DailyStatUnit" ADD COLUMN     "dailyChallengeResponseID" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DailyStatUnit_date_dailyChallengeResponseID_key" ON "DailyStatUnit"("date", "dailyChallengeResponseID");

-- AddForeignKey
ALTER TABLE "DailyStatUnit" ADD CONSTRAINT "DailyStatUnit_dailyChallengeResponseID_fkey" FOREIGN KEY ("dailyChallengeResponseID") REFERENCES "DailyChallengeResponse"("dailyChallengeResponseID") ON DELETE SET NULL ON UPDATE CASCADE;
