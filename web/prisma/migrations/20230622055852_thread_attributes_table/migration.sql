-- CreateEnum
CREATE TYPE "ChatMessageAuthor" AS ENUM ('USER', 'SYSTEM');

-- CreateTable
CREATE TABLE "ThreadAttributes" (
    "threadID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "enhancedDocumentID" TEXT NOT NULL,
    "sectionData" JSONB,

    CONSTRAINT "ThreadAttributes_pkey" PRIMARY KEY ("threadID")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "chatMessageID" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" "ChatMessageAuthor" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "threadID" TEXT NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("chatMessageID")
);

-- AddForeignKey
ALTER TABLE "ThreadAttributes" ADD CONSTRAINT "ThreadAttributes_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadAttributes" ADD CONSTRAINT "ThreadAttributes_enhancedDocumentID_fkey" FOREIGN KEY ("enhancedDocumentID") REFERENCES "EnhancedDocument"("enhancedDocumentID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadID_fkey" FOREIGN KEY ("threadID") REFERENCES "ThreadAttributes"("threadID") ON DELETE RESTRICT ON UPDATE CASCADE;
