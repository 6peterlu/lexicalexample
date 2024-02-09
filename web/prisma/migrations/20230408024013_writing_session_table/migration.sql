-- CreateTable
CREATE TABLE "WritingSession" (
    "writingSessionID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "segmentTime" INTEGER[],
    "wordsAdded" INTEGER NOT NULL DEFAULT 0,
    "wordsRemoved" INTEGER NOT NULL DEFAULT 0,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "startDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "documentVersionID" TEXT,

    CONSTRAINT "WritingSession_pkey" PRIMARY KEY ("writingSessionID")
);

-- CreateTable
CREATE TABLE "_writingSessionLikes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_writingSessionLikes_AB_unique" ON "_writingSessionLikes"("A", "B");

-- CreateIndex
CREATE INDEX "_writingSessionLikes_B_index" ON "_writingSessionLikes"("B");

-- AddForeignKey
ALTER TABLE "WritingSession" ADD CONSTRAINT "WritingSession_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingSession" ADD CONSTRAINT "WritingSession_documentVersionID_fkey" FOREIGN KEY ("documentVersionID") REFERENCES "DocumentVersion"("documentVersionID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_writingSessionLikes" ADD CONSTRAINT "_writingSessionLikes_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_writingSessionLikes" ADD CONSTRAINT "_writingSessionLikes_B_fkey" FOREIGN KEY ("B") REFERENCES "WritingSession"("writingSessionID") ON DELETE CASCADE ON UPDATE CASCADE;
