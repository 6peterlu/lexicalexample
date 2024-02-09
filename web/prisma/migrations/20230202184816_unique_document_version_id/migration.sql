/*
  Warnings:

  - A unique constraint covering the columns `[documentVersionID]` on the table `DailyStatUnit` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DailyStatUnit_documentVersionID_key" ON "DailyStatUnit"("documentVersionID");
