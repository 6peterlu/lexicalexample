/*
  Warnings:

  - A unique constraint covering the columns `[userID,date,documentVersionID]` on the table `DailyStatUnit` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DailyStatUnit_userID_date_documentVersionID_idx";

-- CreateIndex
CREATE UNIQUE INDEX "DailyStatUnit_userID_date_documentVersionID_key" ON "DailyStatUnit"("userID", "date", "documentVersionID");
