-- DropIndex
DROP INDEX "DailyStatUnit_documentVersionID_key";

-- CreateIndex
CREATE INDEX "DailyStatUnit_userID_date_documentVersionID_idx" ON "DailyStatUnit"("userID", "date", "documentVersionID");
