-- CreateTable
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL,
    "vatRate" REAL NOT NULL,
    "withholdingRate" REAL NOT NULL DEFAULT 0,
    "socialContributionRate" REAL NOT NULL DEFAULT 0,
    "employerContributionRate" REAL NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxRule_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractFinancialSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "countryId" TEXT,
    "contractType" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "grossAmountCents" INTEGER NOT NULL,
    "vatAmountCents" INTEGER NOT NULL,
    "netAmountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "escrowRequiredAmountCents" INTEGER NOT NULL,
    "workerGrossPayCents" INTEGER,
    "workerNetPayCents" INTEGER,
    "employerCostCents" INTEGER,
    "calculationJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractFinancialSnapshot_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractFinancialSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractFinancialSnapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractFinancialSnapshot_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TaxRule_countryId_appliesTo_isActive_idx" ON "TaxRule"("countryId", "appliesTo", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRule_countryId_code_key" ON "TaxRule"("countryId", "code");

-- CreateIndex
CREATE INDEX "ContractFinancialSnapshot_contractId_createdAt_idx" ON "ContractFinancialSnapshot"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractFinancialSnapshot_projectId_createdAt_idx" ON "ContractFinancialSnapshot"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractFinancialSnapshot_profileId_createdAt_idx" ON "ContractFinancialSnapshot"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractFinancialSnapshot_countryId_createdAt_idx" ON "ContractFinancialSnapshot"("countryId", "createdAt");
