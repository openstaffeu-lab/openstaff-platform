-- CreateTable
CREATE TABLE "ProjectInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "profileId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currencyCode" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "vatCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "description" TEXT,
    "issuedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectInvoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectInvoice_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ProjectMilestone" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectInvoice_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectInvoice_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "escrowAccountId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectPayment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ProjectInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectPayment_escrowAccountId_fkey" FOREIGN KEY ("escrowAccountId") REFERENCES "ProjectEscrowAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectPayment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvoice_invoiceNumber_key" ON "ProjectInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "ProjectInvoice_projectId_createdAt_idx" ON "ProjectInvoice"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectInvoice_contractId_status_createdAt_idx" ON "ProjectInvoice"("contractId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectInvoice_milestoneId_idx" ON "ProjectInvoice"("milestoneId");

-- CreateIndex
CREATE INDEX "ProjectInvoice_profileId_status_createdAt_idx" ON "ProjectInvoice"("profileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectInvoice_issuedById_createdAt_idx" ON "ProjectInvoice"("issuedById", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectPayment_projectId_createdAt_idx" ON "ProjectPayment"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectPayment_contractId_status_createdAt_idx" ON "ProjectPayment"("contractId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectPayment_invoiceId_status_createdAt_idx" ON "ProjectPayment"("invoiceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectPayment_escrowAccountId_status_createdAt_idx" ON "ProjectPayment"("escrowAccountId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectPayment_profileId_status_createdAt_idx" ON "ProjectPayment"("profileId", "status", "createdAt");
