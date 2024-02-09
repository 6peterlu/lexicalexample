-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_threadID_fkey";

-- DropForeignKey
ALTER TABLE "ThreadAttributes" DROP CONSTRAINT "ThreadAttributes_enhancedDocumentID_fkey";

-- AddForeignKey
ALTER TABLE "ThreadAttributes" ADD CONSTRAINT "ThreadAttributes_enhancedDocumentID_fkey" FOREIGN KEY ("enhancedDocumentID") REFERENCES "EnhancedDocument"("enhancedDocumentID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadID_fkey" FOREIGN KEY ("threadID") REFERENCES "ThreadAttributes"("threadID") ON DELETE CASCADE ON UPDATE CASCADE;
