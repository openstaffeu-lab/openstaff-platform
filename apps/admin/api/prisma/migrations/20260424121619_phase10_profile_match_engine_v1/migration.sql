-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "companyName" TEXT,
    "description" TEXT,
    "summary" TEXT,
    "countryId" TEXT,
    "regionId" TEXT,
    "cityId" TEXT,
    "supportedEngagementModels" TEXT,
    "certificationsText" TEXT,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "rating" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Profile_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Profile_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Profile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "tradeFocus" TEXT,
    "teamSize" INTEGER,
    "serviceArea" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractorProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfessionalProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "headline" TEXT,
    "yearsExperience" INTEGER,
    "portfolioFocus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfessionalProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileLanguage" (
    "profileId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("profileId", "languageId"),
    CONSTRAINT "ProfileLanguage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
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
    "extractedText" TEXT,
    "extractionStatus" TEXT NOT NULL DEFAULT 'NOT_REQUESTED',
    "extractionError" TEXT,
    "extractedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfileDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileEscoClassification" (
    "profileId" TEXT NOT NULL,
    "escoSkillId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("profileId", "escoSkillId"),
    CONSTRAINT "ProfileEscoClassification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileEscoClassification_escoSkillId_fkey" FOREIGN KEY ("escoSkillId") REFERENCES "EscoSkill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileNaceClassification" (
    "profileId" TEXT NOT NULL,
    "naceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("profileId", "naceId"),
    CONSTRAINT "ProfileNaceClassification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileNaceClassification_naceId_fkey" FOREIGN KEY ("naceId") REFERENCES "Nace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileUniclassClassification" (
    "profileId" TEXT NOT NULL,
    "uniclassId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("profileId", "uniclassId"),
    CONSTRAINT "ProfileUniclassClassification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileUniclassClassification_uniclassId_fkey" FOREIGN KEY ("uniclassId") REFERENCES "Uniclass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_profileType_idx" ON "Profile"("profileType");

-- CreateIndex
CREATE INDEX "Profile_countryId_regionId_cityId_idx" ON "Profile"("countryId", "regionId", "cityId");

-- CreateIndex
CREATE INDEX "Profile_availabilityStatus_idx" ON "Profile"("availabilityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ContractorProfile_profileId_key" ON "ContractorProfile"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalProfile_profileId_key" ON "ProfessionalProfile"("profileId");

-- CreateIndex
CREATE INDEX "ProfileLanguage_languageId_idx" ON "ProfileLanguage"("languageId");

-- CreateIndex
CREATE INDEX "ProfileDocument_profileId_type_idx" ON "ProfileDocument"("profileId", "type");

-- CreateIndex
CREATE INDEX "ProfileDocument_uploadedById_idx" ON "ProfileDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "ProfileEscoClassification_escoSkillId_idx" ON "ProfileEscoClassification"("escoSkillId");

-- CreateIndex
CREATE INDEX "ProfileNaceClassification_naceId_idx" ON "ProfileNaceClassification"("naceId");

-- CreateIndex
CREATE INDEX "ProfileUniclassClassification_uniclassId_idx" ON "ProfileUniclassClassification"("uniclassId");
