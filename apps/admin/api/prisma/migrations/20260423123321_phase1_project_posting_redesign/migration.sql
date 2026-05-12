/*
  Warnings:

  - Added the required column `engagementModel` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ProjectJobRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scopeOfWork" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "workerCount" INTEGER,
    "unit" TEXT,
    "budgetMinCents" INTEGER,
    "budgetMaxCents" INTEGER,
    "currencyCode" TEXT,
    "requiredExperienceYears" INTEGER,
    "requiresCertification" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "responseDeadline" TIMESTAMP(3),
    "languageId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectJobRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectJobRequest_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "jobRequestId" TEXT,
    "type" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'PROJECT',
    "title" TEXT NOT NULL,
    "clauseKey" TEXT,
    "content" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectCondition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectCondition_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectAIInterpretation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sourceText" TEXT,
    "extractedJson" TEXT,
    "confidenceScore" REAL,
    "modelName" TEXT,
    "modelVersion" TEXT,
    "promptVersion" TEXT,
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectAIInterpretation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectAIInterpretation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "jobRequestId" TEXT,
    "uploadedById" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageBucket" TEXT,
    "storageKey" TEXT NOT NULL,
    "checksumSha256" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectDocument_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectEscoClassification" (
    "projectId" TEXT NOT NULL,
    "escoSkillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("projectId", "escoSkillId"),
    CONSTRAINT "ProjectEscoClassification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectEscoClassification_escoSkillId_fkey" FOREIGN KEY ("escoSkillId") REFERENCES "EscoSkill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectNaceClassification" (
    "projectId" TEXT NOT NULL,
    "naceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("projectId", "naceId"),
    CONSTRAINT "ProjectNaceClassification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectNaceClassification_naceId_fkey" FOREIGN KEY ("naceId") REFERENCES "Nace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectUniclassClassification" (
    "projectId" TEXT NOT NULL,
    "uniclassId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("projectId", "uniclassId"),
    CONSTRAINT "ProjectUniclassClassification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectUniclassClassification_uniclassId_fkey" FOREIGN KEY ("uniclassId") REFERENCES "Uniclass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectJobRequestEscoClassification" (
    "jobRequestId" TEXT NOT NULL,
    "escoSkillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("jobRequestId", "escoSkillId"),
    CONSTRAINT "ProjectJobRequestEscoClassification_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectJobRequestEscoClassification_escoSkillId_fkey" FOREIGN KEY ("escoSkillId") REFERENCES "EscoSkill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectJobRequestNaceClassification" (
    "jobRequestId" TEXT NOT NULL,
    "naceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("jobRequestId", "naceId"),
    CONSTRAINT "ProjectJobRequestNaceClassification_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectJobRequestNaceClassification_naceId_fkey" FOREIGN KEY ("naceId") REFERENCES "Nace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectJobRequestUniclassClassification" (
    "jobRequestId" TEXT NOT NULL,
    "uniclassId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("jobRequestId", "uniclassId"),
    CONSTRAINT "ProjectJobRequestUniclassClassification_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectJobRequestUniclassClassification_uniclassId_fkey" FOREIGN KEY ("uniclassId") REFERENCES "Uniclass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "scopeOfWork" TEXT,
    "engagementModel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "location" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "postalCode" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "countryId" TEXT,
    "regionId" TEXT,
    "cityId" TEXT,
    "primaryLanguageId" TEXT,
    "budgetMinCents" INTEGER,
    "budgetMaxCents" INTEGER,
    "currencyCode" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "responseDeadline" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_primaryLanguageId_fkey" FOREIGN KEY ("primaryLanguageId") REFERENCES "Language" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" (
    "id",
    "slug",
    "name",
    "engagementModel",
    "status",
    "visibility",
    "location",
    "createdAt",
    "updatedAt",
    "createdById"
)
SELECT
    "id",
    lower(replace(replace(trim(coalesce("name", 'project')), ' ', '-'), '--', '-')) || '-' || substr("id", 1, 8),
    "name",
    'MIXED',
    CASE
      WHEN upper(coalesce("status", '')) IN ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED')
        THEN upper("status")
      ELSE 'DRAFT'
    END,
    'PRIVATE',
    "location",
    "createdAt",
    coalesce("createdAt", CURRENT_TIMESTAMP),
    "createdById"
FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
CREATE INDEX "Project_createdById_createdAt_idx" ON "Project"("createdById", "createdAt");
CREATE INDEX "Project_status_engagementModel_idx" ON "Project"("status", "engagementModel");
CREATE INDEX "Project_countryId_regionId_cityId_idx" ON "Project"("countryId", "regionId", "cityId");

-- CreateIndex
CREATE INDEX "ProjectJobRequest_projectId_status_idx" ON "ProjectJobRequest"("projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectJobRequest_languageId_idx" ON "ProjectJobRequest"("languageId");

-- CreateIndex
CREATE INDEX "ProjectCondition_projectId_scope_sortOrder_idx" ON "ProjectCondition"("projectId", "scope", "sortOrder");

-- CreateIndex
CREATE INDEX "ProjectCondition_jobRequestId_idx" ON "ProjectCondition"("jobRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAIInterpretation_projectId_key" ON "ProjectAIInterpretation"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAIInterpretation_status_idx" ON "ProjectAIInterpretation"("status");

-- CreateIndex
CREATE INDEX "ProjectAIInterpretation_reviewedById_idx" ON "ProjectAIInterpretation"("reviewedById");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_type_idx" ON "ProjectDocument"("projectId", "type");

-- CreateIndex
CREATE INDEX "ProjectDocument_jobRequestId_idx" ON "ProjectDocument"("jobRequestId");

-- CreateIndex
CREATE INDEX "ProjectDocument_uploadedById_idx" ON "ProjectDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "ProjectEscoClassification_escoSkillId_idx" ON "ProjectEscoClassification"("escoSkillId");

-- CreateIndex
CREATE INDEX "ProjectNaceClassification_naceId_idx" ON "ProjectNaceClassification"("naceId");

-- CreateIndex
CREATE INDEX "ProjectUniclassClassification_uniclassId_idx" ON "ProjectUniclassClassification"("uniclassId");

-- CreateIndex
CREATE INDEX "ProjectJobRequestEscoClassification_escoSkillId_idx" ON "ProjectJobRequestEscoClassification"("escoSkillId");

-- CreateIndex
CREATE INDEX "ProjectJobRequestNaceClassification_naceId_idx" ON "ProjectJobRequestNaceClassification"("naceId");

-- CreateIndex
CREATE INDEX "ProjectJobRequestUniclassClassification_uniclassId_idx" ON "ProjectJobRequestUniclassClassification"("uniclassId");

-- CreateIndex
CREATE INDEX "City_regionId_idx" ON "City"("regionId");

-- CreateIndex
CREATE INDEX "Region_countryId_idx" ON "Region"("countryId");
