-- CreateTable
CREATE TABLE "DailyChallengePromptSuggestion" (
    "promptSuggestionID" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedOn" DATE,

    CONSTRAINT "DailyChallengePromptSuggestion_pkey" PRIMARY KEY ("promptSuggestionID")
);

-- AddForeignKey
ALTER TABLE "DailyChallengePromptSuggestion" ADD CONSTRAINT "DailyChallengePromptSuggestion_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;
