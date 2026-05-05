-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "jobRequestId" TEXT,
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
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectDocument_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProjectDocument" ("checksumSha256", "createdAt", "description", "fileName", "id", "isPublic", "jobRequestId", "mimeType", "projectId", "sizeBytes", "storageBucket", "storageKey", "storageProvider", "title", "type", "updatedAt", "uploadedById") SELECT "checksumSha256", "createdAt", "description", "fileName", "id", "isPublic", "jobRequestId", "mimeType", "projectId", "sizeBytes", "storageBucket", "storageKey", "storageProvider", "title", "type", "updatedAt", "uploadedById" FROM "ProjectDocument";
DROP TABLE "ProjectDocument";
ALTER TABLE "new_ProjectDocument" RENAME TO "ProjectDocument";
CREATE INDEX "ProjectDocument_projectId_type_idx" ON "ProjectDocument"("projectId", "type");
CREATE INDEX "ProjectDocument_jobRequestId_idx" ON "ProjectDocument"("jobRequestId");
CREATE INDEX "ProjectDocument_uploadedById_idx" ON "ProjectDocument"("uploadedById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
