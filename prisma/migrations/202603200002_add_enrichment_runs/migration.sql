-- CreateEnum
CREATE TYPE "EnrichmentRunKind" AS ENUM ('ai', 'itwewina');

-- CreateEnum
CREATE TYPE "EnrichmentRunStatus" AS ENUM ('queued', 'running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "EnrichmentRun" (
    "id" TEXT NOT NULL,
    "kind" "EnrichmentRunKind" NOT NULL,
    "status" "EnrichmentRunStatus" NOT NULL DEFAULT 'queued',
    "stage" TEXT,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "term" TEXT,
    "statusMessage" TEXT,
    "unitLabel" TEXT,
    "warnings" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "EnrichmentRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnrichmentRun_status_createdAt_idx" ON "EnrichmentRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EnrichmentRun_kind_createdAt_idx" ON "EnrichmentRun"("kind", "createdAt");
