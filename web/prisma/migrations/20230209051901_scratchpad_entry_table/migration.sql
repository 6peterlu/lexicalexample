-- CreateTable
CREATE TABLE "ScratchpadEntry" (
    "scratchpadEntryID" TEXT NOT NULL,
    "content" JSONB,
    "date" DATE NOT NULL,
    "userID" TEXT NOT NULL,

    CONSTRAINT "ScratchpadEntry_pkey" PRIMARY KEY ("scratchpadEntryID")
);

-- AddForeignKey
ALTER TABLE "ScratchpadEntry" ADD CONSTRAINT "ScratchpadEntry_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;
