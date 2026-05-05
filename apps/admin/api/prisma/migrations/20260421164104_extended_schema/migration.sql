/*
  Warnings:

  - Added the required column `projectId` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "vatRate" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    CONSTRAINT "Region_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    CONSTRAINT "City_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Uniclass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "EscoSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Nace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "countryId" TEXT,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Profile_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "vat" REAL NOT NULL,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractId" TEXT NOT NULL,
    CONSTRAINT "Invoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "balance" REAL NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EscoSkillToProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EscoSkillToProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "EscoSkill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EscoSkillToProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_NaceToProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_NaceToProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "Nace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_NaceToProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContractToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContractToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContractToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Contract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("code", "createdAt", "id", "status", "value") SELECT "code", "createdAt", "id", "status", "value" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE UNIQUE INDEX "Contract_code_key" ON "Contract"("code");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "countryId" TEXT,
    "regionId" TEXT,
    "cityId" TEXT,
    "uniclassId" TEXT,
    CONSTRAINT "Project_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_uniclassId_fkey" FOREIGN KEY ("uniclassId") REFERENCES "Uniclass" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "id", "location", "name", "status") SELECT "createdAt", "id", "location", "name", "status" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Uniclass_code_key" ON "Uniclass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EscoSkill_code_key" ON "EscoSkill"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Nace_code_key" ON "Nace"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_EscoSkillToProfile_AB_unique" ON "_EscoSkillToProfile"("A", "B");

-- CreateIndex
CREATE INDEX "_EscoSkillToProfile_B_index" ON "_EscoSkillToProfile"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_NaceToProfile_AB_unique" ON "_NaceToProfile"("A", "B");

-- CreateIndex
CREATE INDEX "_NaceToProfile_B_index" ON "_NaceToProfile"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContractToUser_AB_unique" ON "_ContractToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ContractToUser_B_index" ON "_ContractToUser"("B");
