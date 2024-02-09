-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_documentVersionID_fkey";

-- DropForeignKey
ALTER TABLE "DocumentVersion" DROP CONSTRAINT "DocumentVersion_documentID_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_userID_fkey";

-- DropForeignKey
ALTER TABLE "UserDocumentPermission" DROP CONSTRAINT "UserDocumentPermission_documentID_fkey";

-- DropForeignKey
ALTER TABLE "UserDocumentPermission" DROP CONSTRAINT "UserDocumentPermission_documentVersionID_fkey";

-- DropForeignKey
ALTER TABLE "UserDocumentPermission" DROP CONSTRAINT "UserDocumentPermission_userID_fkey";

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_documentVersionID_fkey" FOREIGN KEY ("documentVersionID") REFERENCES "DocumentVersion"("documentVersionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentPermission" ADD CONSTRAINT "UserDocumentPermission_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentPermission" ADD CONSTRAINT "UserDocumentPermission_documentVersionID_fkey" FOREIGN KEY ("documentVersionID") REFERENCES "DocumentVersion"("documentVersionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentPermission" ADD CONSTRAINT "UserDocumentPermission_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE CASCADE ON UPDATE CASCADE;
