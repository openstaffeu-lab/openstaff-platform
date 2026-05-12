-- CreateTable
CREATE TABLE "ProfileWorker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "roleTitle" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfileWorker_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileWorker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "medicalCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkerDocument_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "escoSkillId" TEXT,
    "title" TEXT NOT NULL,
    "level" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkerSkill_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerSkill_escoSkillId_fkey" FOREIGN KEY ("escoSkillId") REFERENCES "EscoSkill" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectWorkerAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT,
    "jobRequestId" TEXT,
    "profileId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "assignedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    CONSTRAINT "ProjectWorkerAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectWorkerAssignment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectWorkerAssignment_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectWorkerAssignment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectWorkerAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectWorkerAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectWorkerAssignment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProfileWorker_profileId_status_createdAt_idx" ON "ProfileWorker"("profileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileWorker_userId_idx" ON "ProfileWorker"("userId");

-- CreateIndex
CREATE INDEX "WorkerDocument_workerId_type_status_idx" ON "WorkerDocument"("workerId", "type", "status");

-- CreateIndex
CREATE INDEX "WorkerDocument_expiresAt_idx" ON "WorkerDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "WorkerSkill_workerId_createdAt_idx" ON "WorkerSkill"("workerId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerSkill_escoSkillId_idx" ON "WorkerSkill"("escoSkillId");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_projectId_status_assignedAt_idx" ON "ProjectWorkerAssignment"("projectId", "status", "assignedAt");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_contractId_status_idx" ON "ProjectWorkerAssignment"("contractId", "status");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_jobRequestId_status_idx" ON "ProjectWorkerAssignment"("jobRequestId", "status");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_profileId_status_idx" ON "ProjectWorkerAssignment"("profileId", "status");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_workerId_status_idx" ON "ProjectWorkerAssignment"("workerId", "status");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_assignedById_assignedAt_idx" ON "ProjectWorkerAssignment"("assignedById", "assignedAt");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_approvedById_approvedAt_idx" ON "ProjectWorkerAssignment"("approvedById", "approvedAt");
