-- AlterTable
ALTER TABLE "EnhancedDocument" ADD COLUMN     "ideas" TEXT[] DEFAULT ARRAY[]::TEXT[];
