-- CreateEnum
CREATE TYPE "EnhancedDocumentRole" AS ENUM ('OWNER');

-- CreateTable
CREATE TABLE "UserEnhancedDocumentPermissions" (
    "userID" TEXT NOT NULL,
    "enhancedDocumentID" TEXT NOT NULL,
    "role" "EnhancedDocumentRole" NOT NULL,

    CONSTRAINT "UserEnhancedDocumentPermissions_pkey" PRIMARY KEY ("userID","enhancedDocumentID")
);

-- CreateTable
CREATE TABLE "EnhancedDocument" (
    "enhancedDocumentID" TEXT NOT NULL,
    "notesContent" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnhancedDocument_pkey" PRIMARY KEY ("enhancedDocumentID")
);

-- AddForeignKey
ALTER TABLE "UserEnhancedDocumentPermissions" ADD CONSTRAINT "UserEnhancedDocumentPermissions_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEnhancedDocumentPermissions" ADD CONSTRAINT "UserEnhancedDocumentPermissions_enhancedDocumentID_fkey" FOREIGN KEY ("enhancedDocumentID") REFERENCES "EnhancedDocument"("enhancedDocumentID") ON DELETE CASCADE ON UPDATE CASCADE;
