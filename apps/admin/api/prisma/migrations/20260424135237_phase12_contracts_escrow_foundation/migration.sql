-- CreateTable
CREATE TABLE "ProjectContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "contractType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scopeSummary" TEXT,
    "commercialTerms" TEXT,
    "paymentTerms" TEXT,
    "safetyTerms" TEXT,
    "insuranceTerms" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectContract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectContract_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ProjectProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectContract_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectContract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectEscrowAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_FUNDED',
    "currencyCode" TEXT,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "fundedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "releasedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectEscrowAccount_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectEscrowAccount_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectMilestone_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProjectContract_projectId_status_createdAt_idx" ON "ProjectContract"("projectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectContract_profileId_status_createdAt_idx" ON "ProjectContract"("profileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectContract_createdById_idx" ON "ProjectContract"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectContract_proposalId_key" ON "ProjectContract"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectEscrowAccount_contractId_key" ON "ProjectEscrowAccount"("contractId");

-- CreateIndex
CREATE INDEX "ProjectEscrowAccount_projectId_status_createdAt_idx" ON "ProjectEscrowAccount"("projectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_contractId_status_idx" ON "ProjectMilestone"("projectId", "contractId", "status");

-- CreateIndex
CREATE INDEX "ProjectMilestone_contractId_createdAt_idx" ON "ProjectMilestone"("contractId", "createdAt");
