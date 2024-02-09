-- AlterTable
ALTER TABLE "EnhancedDocument" ALTER COLUMN "embeddingsByNodeID" DROP NOT NULL,
ALTER COLUMN "embeddingsByNodeID" DROP DEFAULT;
