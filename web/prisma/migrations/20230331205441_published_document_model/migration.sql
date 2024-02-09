-- CreateTable
CREATE TABLE "PublishedDocument" (
    "documentID" TEXT NOT NULL,
    "content" JSONB,
    "url" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "PublishedDocument_pkey" PRIMARY KEY ("documentID","userID")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublishedDocument_userID_url_key" ON "PublishedDocument"("userID", "url");

-- AddForeignKey
ALTER TABLE "PublishedDocument" ADD CONSTRAINT "PublishedDocument_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedDocument" ADD CONSTRAINT "PublishedDocument_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;
