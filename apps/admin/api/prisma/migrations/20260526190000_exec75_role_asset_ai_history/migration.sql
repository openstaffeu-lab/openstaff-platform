ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'AI_MODERATOR';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'MODERATE_AI';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'MANAGE_TECHNICAL_OPERATIONS';

ALTER TABLE "ProfileDocument"
  ADD COLUMN "moderationStatus" "PublicModerationStatus" NOT NULL DEFAULT 'PENDING';

CREATE INDEX "ProfileDocument_profileId_moderationStatus_assetKind_idx"
  ON "ProfileDocument"("profileId", "moderationStatus", "assetKind");

CREATE TABLE "ProjectAIInterpretationRun" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "status" "ProjectAIInterpretationStatus" NOT NULL DEFAULT 'PENDING',
  "sourceText" TEXT,
  "extractedJson" TEXT,
  "documentIds" TEXT,
  "confidenceScore" DOUBLE PRECISION,
  "modelName" TEXT,
  "modelVersion" TEXT,
  "promptVersion" TEXT,
  "reviewedById" TEXT,
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProjectAIInterpretationRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectAIInterpretationRun_projectId_createdAt_idx"
  ON "ProjectAIInterpretationRun"("projectId", "createdAt");

CREATE INDEX "ProjectAIInterpretationRun_status_idx"
  ON "ProjectAIInterpretationRun"("status");

CREATE INDEX "ProjectAIInterpretationRun_reviewedById_idx"
  ON "ProjectAIInterpretationRun"("reviewedById");

ALTER TABLE "ProjectAIInterpretationRun"
  ADD CONSTRAINT "ProjectAIInterpretationRun_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectAIInterpretationRun"
  ADD CONSTRAINT "ProjectAIInterpretationRun_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
