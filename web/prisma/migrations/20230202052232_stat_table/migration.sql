-- CreateTable
CREATE TABLE "StatUnit" (
    "statUnitID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "documentVersionID" TEXT,
    "documentID" TEXT,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "wordsAdded" INTEGER NOT NULL DEFAULT 0,
    "wordsRemoved" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StatUnit_pkey" PRIMARY KEY ("statUnitID")
);

-- AddForeignKey
ALTER TABLE "StatUnit" ADD CONSTRAINT "StatUnit_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatUnit" ADD CONSTRAINT "StatUnit_documentVersionID_fkey" FOREIGN KEY ("documentVersionID") REFERENCES "DocumentVersion"("documentVersionID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatUnit" ADD CONSTRAINT "StatUnit_documentID_fkey" FOREIGN KEY ("documentID") REFERENCES "Document"("documentID") ON DELETE SET NULL ON UPDATE CASCADE;
