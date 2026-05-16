-- CreateTable
CREATE TABLE "ActorDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileDocumentId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActorDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActorDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActorDocument_profileDocumentId_fkey" FOREIGN KEY ("profileDocumentId") REFERENCES "ProfileDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActorDocument_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActorCertification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorDocumentId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "escoSkillId" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActorCertification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActorCertification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActorCertification_actorDocumentId_fkey" FOREIGN KEY ("actorDocumentId") REFERENCES "ActorDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActorCertification_escoSkillId_fkey" FOREIGN KEY ("escoSkillId") REFERENCES "EscoSkill" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActorCertification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicalFitnessCertificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorDocumentId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "issuedByProfileId" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fitnessDecision" TEXT NOT NULL DEFAULT 'REQUIRES_REVIEW',
    "jobSpecificClearance" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MedicalFitnessCertificate_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicalFitnessCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicalFitnessCertificate_actorDocumentId_fkey" FOREIGN KEY ("actorDocumentId") REFERENCES "ActorDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MedicalFitnessCertificate_issuedByProfileId_fkey" FOREIGN KEY ("issuedByProfileId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MedicalFitnessCertificate_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "projectId" TEXT,
    "contractId" TEXT,
    "actorDocumentId" TEXT,
    "actorCertificationId" TEXT,
    "medicalFitnessCertificateId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "ComplianceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceAlert_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceAlert_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceAlert_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceAlert_actorDocumentId_fkey" FOREIGN KEY ("actorDocumentId") REFERENCES "ActorDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceAlert_actorCertificationId_fkey" FOREIGN KEY ("actorCertificationId") REFERENCES "ActorCertification" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceAlert_medicalFitnessCertificateId_fkey" FOREIGN KEY ("medicalFitnessCertificateId") REFERENCES "MedicalFitnessCertificate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "assignedToUserId" TEXT NOT NULL,
    "projectId" TEXT,
    "contractId" TEXT,
    "profileId" TEXT,
    "actorDocumentId" TEXT,
    "actorCertificationId" TEXT,
    "medicalFitnessCertificateId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "UserTask_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTask_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTask_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTask_actorDocumentId_fkey" FOREIGN KEY ("actorDocumentId") REFERENCES "ActorDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTask_actorCertificationId_fkey" FOREIGN KEY ("actorCertificationId") REFERENCES "ActorCertification" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTask_medicalFitnessCertificateId_fkey" FOREIGN KEY ("medicalFitnessCertificateId") REFERENCES "MedicalFitnessCertificate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ActorDocument_profileId_type_status_idx" ON "ActorDocument"("profileId", "type", "status");

-- CreateIndex
CREATE INDEX "ActorDocument_userId_status_idx" ON "ActorDocument"("userId", "status");

-- CreateIndex
CREATE INDEX "ActorDocument_expiresAt_idx" ON "ActorDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "ActorDocument_verifiedById_idx" ON "ActorDocument"("verifiedById");

-- CreateIndex
CREATE INDEX "ActorCertification_profileId_type_status_idx" ON "ActorCertification"("profileId", "type", "status");

-- CreateIndex
CREATE INDEX "ActorCertification_userId_status_idx" ON "ActorCertification"("userId", "status");

-- CreateIndex
CREATE INDEX "ActorCertification_escoSkillId_idx" ON "ActorCertification"("escoSkillId");

-- CreateIndex
CREATE INDEX "ActorCertification_expiresAt_idx" ON "ActorCertification"("expiresAt");

-- CreateIndex
CREATE INDEX "ActorCertification_verifiedById_idx" ON "ActorCertification"("verifiedById");

-- CreateIndex
CREATE INDEX "MedicalFitnessCertificate_profileId_category_status_idx" ON "MedicalFitnessCertificate"("profileId", "category", "status");

-- CreateIndex
CREATE INDEX "MedicalFitnessCertificate_userId_status_idx" ON "MedicalFitnessCertificate"("userId", "status");

-- CreateIndex
CREATE INDEX "MedicalFitnessCertificate_issuedByProfileId_idx" ON "MedicalFitnessCertificate"("issuedByProfileId");

-- CreateIndex
CREATE INDEX "MedicalFitnessCertificate_expiresAt_idx" ON "MedicalFitnessCertificate"("expiresAt");

-- CreateIndex
CREATE INDEX "MedicalFitnessCertificate_verifiedById_idx" ON "MedicalFitnessCertificate"("verifiedById");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceAlert_key_key" ON "ComplianceAlert"("key");

-- CreateIndex
CREATE INDEX "ComplianceAlert_userId_status_createdAt_idx" ON "ComplianceAlert"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceAlert_profileId_status_idx" ON "ComplianceAlert"("profileId", "status");

-- CreateIndex
CREATE INDEX "ComplianceAlert_projectId_status_idx" ON "ComplianceAlert"("projectId", "status");

-- CreateIndex
CREATE INDEX "ComplianceAlert_contractId_status_idx" ON "ComplianceAlert"("contractId", "status");

-- CreateIndex
CREATE INDEX "ComplianceAlert_dueDate_status_idx" ON "ComplianceAlert"("dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_key_key" ON "UserTask"("key");

-- CreateIndex
CREATE INDEX "UserTask_assignedToUserId_status_dueDate_idx" ON "UserTask"("assignedToUserId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "UserTask_projectId_status_idx" ON "UserTask"("projectId", "status");

-- CreateIndex
CREATE INDEX "UserTask_contractId_status_idx" ON "UserTask"("contractId", "status");

-- CreateIndex
CREATE INDEX "UserTask_profileId_status_idx" ON "UserTask"("profileId", "status");
