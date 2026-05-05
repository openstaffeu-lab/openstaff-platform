-- CreateTable
CREATE TABLE "ProjectDispute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "openedById" TEXT NOT NULL,
    "againstProfileId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolutionNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    CONSTRAINT "ProjectDispute_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectDispute_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectDispute_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ProjectMilestone" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectDispute_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ProjectInvoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectDispute_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ProjectPayment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectDispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectDispute_againstProfileId_fkey" FOREIGN KEY ("againstProfileId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectDisputeEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disputeId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectDisputeEvent_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "ProjectDispute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectDisputeEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProjectDispute_projectId_status_createdAt_idx" ON "ProjectDispute"("projectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectDispute_contractId_status_createdAt_idx" ON "ProjectDispute"("contractId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectDispute_milestoneId_status_idx" ON "ProjectDispute"("milestoneId", "status");

-- CreateIndex
CREATE INDEX "ProjectDispute_invoiceId_status_idx" ON "ProjectDispute"("invoiceId", "status");

-- CreateIndex
CREATE INDEX "ProjectDispute_paymentId_status_idx" ON "ProjectDispute"("paymentId", "status");

-- CreateIndex
CREATE INDEX "ProjectDispute_openedById_createdAt_idx" ON "ProjectDispute"("openedById", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectDispute_againstProfileId_status_idx" ON "ProjectDispute"("againstProfileId", "status");

-- CreateIndex
CREATE INDEX "ProjectDisputeEvent_disputeId_createdAt_idx" ON "ProjectDisputeEvent"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectDisputeEvent_actorUserId_createdAt_idx" ON "ProjectDisputeEvent"("actorUserId", "createdAt");
