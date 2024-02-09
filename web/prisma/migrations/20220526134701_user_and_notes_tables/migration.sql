-- CreateTable
CREATE TABLE "User" (
    "userID" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "Note" (
    "noteID" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "userID" TEXT NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("noteID")
);

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;
