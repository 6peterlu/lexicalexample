-- DropForeignKey
ALTER TABLE "WritingSession" DROP CONSTRAINT "WritingSession_documentID_fkey";

-- AddForeignKey
ALTER TABLE "WritingSession" ADD CONSTRAINT "WritingSession_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE SET NULL ON UPDATE CASCADE;
