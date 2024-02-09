-- CreateTable
CREATE TABLE "DailyChallengeResponseLikes" (
    "userID" TEXT NOT NULL,
    "dailyChallengeResponseID" TEXT NOT NULL,
    "likeID" TEXT NOT NULL,

    CONSTRAINT "DailyChallengeResponseLikes_pkey" PRIMARY KEY ("likeID")
);

-- CreateTable
CREATE TABLE "DailyChallengeResponse" (
    "userID" TEXT NOT NULL,
    "dailyChallengeID" INTEGER NOT NULL,
    "dailyChallengeResponseID" TEXT NOT NULL,

    CONSTRAINT "DailyChallengeResponse_pkey" PRIMARY KEY ("dailyChallengeResponseID")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeResponseLikes_userID_dailyChallengeResponseID_key" ON "DailyChallengeResponseLikes"("userID", "dailyChallengeResponseID");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeResponse_userID_dailyChallengeID_key" ON "DailyChallengeResponse"("userID", "dailyChallengeID");

-- AddForeignKey
ALTER TABLE "DailyChallengeResponseLikes" ADD CONSTRAINT "DailyChallengeResponseLikes_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeResponseLikes" ADD CONSTRAINT "DailyChallengeResponseLikes_likeID_fkey" FOREIGN KEY ("likeID") REFERENCES "DailyChallengeResponse"("dailyChallengeResponseID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeResponse" ADD CONSTRAINT "DailyChallengeResponse_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeResponse" ADD CONSTRAINT "DailyChallengeResponse_dailyChallengeID_fkey" FOREIGN KEY ("dailyChallengeID") REFERENCES "DailyChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
