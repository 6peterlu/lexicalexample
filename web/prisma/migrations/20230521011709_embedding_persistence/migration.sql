-- AlterTable
ALTER TABLE "EnhancedDocument" ADD COLUMN     "embeddingsByNodeID" JSONB NOT NULL DEFAULT '{}';
