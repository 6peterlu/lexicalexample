-- DropForeignKey
ALTER TABLE "DailyChallengeResponse" DROP CONSTRAINT "DailyChallengeResponse_dailyChallengeID_fkey";

-- DropForeignKey
ALTER TABLE "DailyChallengeResponse" DROP CONSTRAINT "DailyChallengeResponse_userID_fkey";

-- DropForeignKey
ALTER TABLE "DailyChallengeResponseLikes" DROP CONSTRAINT "DailyChallengeResponseLikes_likeID_fkey";

-- DropForeignKey
ALTER TABLE "DailyChallengeResponseLikes" DROP CONSTRAINT "DailyChallengeResponseLikes_userID_fkey";

-- AddForeignKey
ALTER TABLE "DailyChallengeResponseLikes" ADD CONSTRAINT "DailyChallengeResponseLikes_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeResponseLikes" ADD CONSTRAINT "DailyChallengeResponseLikes_dailyChallengeResponseID_fkey" FOREIGN KEY ("dailyChallengeResponseID") REFERENCES "DailyChallengeResponse"("dailyChallengeResponseID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeResponse" ADD CONSTRAINT "DailyChallengeResponse_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeResponse" ADD CONSTRAINT "DailyChallengeResponse_dailyChallengeID_fkey" FOREIGN KEY ("dailyChallengeID") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
