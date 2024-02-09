-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "appDrawerUserID" TEXT;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_appDrawerUserID_fkey" FOREIGN KEY ("appDrawerUserID") REFERENCES "User"("userID") ON DELETE SET NULL ON UPDATE CASCADE;
