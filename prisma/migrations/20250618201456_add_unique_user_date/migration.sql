/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `DailyProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DailyProgress_userId_date_key" ON "DailyProgress"("userId", "date");
