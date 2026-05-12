-- CreateTable
CREATE TABLE "WorkerTimesheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT,
    "profileId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalHours" REAL NOT NULL,
    "regularHours" REAL NOT NULL,
    "overtimeHours" REAL NOT NULL,
    "approvedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkerTimesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerTimesheet_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkerTimesheet_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerTimesheet_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerTimesheet_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerPayrollCalculation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timesheetId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT,
    "profileId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "hourlyRateCents" INTEGER NOT NULL,
    "regularPayCents" INTEGER NOT NULL,
    "overtimePayCents" INTEGER NOT NULL,
    "grossPayCents" INTEGER NOT NULL,
    "estimatedTaxCents" INTEGER NOT NULL,
    "estimatedSocialContributionCents" INTEGER NOT NULL,
    "netPayCents" INTEGER NOT NULL,
    "employerCostCents" INTEGER NOT NULL,
    "calculationJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkerPayrollCalculation_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "WorkerTimesheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerPayrollCalculation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerPayrollCalculation_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkerPayrollCalculation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerPayrollCalculation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WorkerTimesheet_projectId_status_periodStart_periodEnd_idx" ON "WorkerTimesheet"("projectId", "status", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "WorkerTimesheet_contractId_status_idx" ON "WorkerTimesheet"("contractId", "status");

-- CreateIndex
CREATE INDEX "WorkerTimesheet_profileId_status_periodStart_idx" ON "WorkerTimesheet"("profileId", "status", "periodStart");

-- CreateIndex
CREATE INDEX "WorkerTimesheet_workerId_status_periodStart_idx" ON "WorkerTimesheet"("workerId", "status", "periodStart");

-- CreateIndex
CREATE INDEX "WorkerTimesheet_approvedById_approvedAt_idx" ON "WorkerTimesheet"("approvedById", "approvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerTimesheet_projectId_workerId_periodStart_periodEnd_key" ON "WorkerTimesheet"("projectId", "workerId", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerPayrollCalculation_timesheetId_key" ON "WorkerPayrollCalculation"("timesheetId");

-- CreateIndex
CREATE INDEX "WorkerPayrollCalculation_projectId_createdAt_idx" ON "WorkerPayrollCalculation"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerPayrollCalculation_contractId_createdAt_idx" ON "WorkerPayrollCalculation"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerPayrollCalculation_profileId_createdAt_idx" ON "WorkerPayrollCalculation"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerPayrollCalculation_workerId_createdAt_idx" ON "WorkerPayrollCalculation"("workerId", "createdAt");
