-- CreateTable
CREATE TABLE "ProjectShortlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "matchScore" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectShortlist_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectShortlist_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectShortlist_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "message" TEXT,
    "sentAt" DATETIME,
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectInvitation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "invitationId" TEXT,
    "submittedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "message" TEXT,
    "priceCents" INTEGER,
    "currencyCode" TEXT,
    "estimatedStartDate" DATETIME,
    "estimatedEndDate" DATETIME,
    "terms" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectProposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectProposal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectProposal_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ProjectInvitation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectProposal_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProjectShortlist_projectId_createdAt_idx" ON "ProjectShortlist"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectShortlist_profileId_createdAt_idx" ON "ProjectShortlist"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectShortlist_createdById_idx" ON "ProjectShortlist"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectShortlist_projectId_profileId_key" ON "ProjectShortlist"("projectId", "profileId");

-- CreateIndex
CREATE INDEX "ProjectInvitation_projectId_status_createdAt_idx" ON "ProjectInvitation"("projectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectInvitation_profileId_status_createdAt_idx" ON "ProjectInvitation"("profileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectInvitation_createdById_idx" ON "ProjectInvitation"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvitation_projectId_profileId_key" ON "ProjectInvitation"("projectId", "profileId");

-- CreateIndex
CREATE INDEX "ProjectProposal_projectId_status_updatedAt_idx" ON "ProjectProposal"("projectId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "ProjectProposal_profileId_status_updatedAt_idx" ON "ProjectProposal"("profileId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "ProjectProposal_submittedById_idx" ON "ProjectProposal"("submittedById");

-- CreateIndex
CREATE INDEX "ProjectProposal_invitationId_idx" ON "ProjectProposal"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectProposal_projectId_profileId_key" ON "ProjectProposal"("projectId", "profileId");
