-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'REVIEWER', 'LIMITED_REVIEWER');

-- CreateTable
CREATE TABLE "Document" (
    "documentID" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("documentID")
);

-- CreateTable
CREATE TABLE "Comment" (
    "commentID" TEXT NOT NULL,
    "commentLocation" JSONB NOT NULL,
    "commentText" TEXT NOT NULL,
    "authorID" TEXT NOT NULL,
    "documentID" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("commentID")
);

-- CreateTable
CREATE TABLE "UserDocumentPermission" (
    "userID" TEXT NOT NULL,
    "documentID" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "UserDocumentPermission_pkey" PRIMARY KEY ("userID","documentID")
);

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentPermission" ADD CONSTRAINT "UserDocumentPermission_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentPermission" ADD CONSTRAINT "UserDocumentPermission_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE RESTRICT ON UPDATE CASCADE;
