-- CreateTable
CREATE TABLE "WorkerAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT,
    "jobRequestId" TEXT,
    "workerId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "checkInAt" DATETIME NOT NULL,
    "checkOutAt" DATETIME,
    "status" TEXT NOT NULL,
    "locationLat" REAL,
    "locationLng" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkerAttendance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerAttendance_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkerAttendance_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkerAttendance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerAttendance_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ProjectWorkerAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerWorkLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "jobRequestId" TEXT,
    "workerId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "date" DATETIME NOT NULL,
    "hoursWorked" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkerWorkLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerWorkLog_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkerWorkLog_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerWorkLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ProjectWorkerAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WorkerAttendance_projectId_createdAt_idx" ON "WorkerAttendance"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerAttendance_workerId_checkInAt_idx" ON "WorkerAttendance"("workerId", "checkInAt");

-- CreateIndex
CREATE INDEX "WorkerAttendance_assignmentId_checkInAt_idx" ON "WorkerAttendance"("assignmentId", "checkInAt");

-- CreateIndex
CREATE INDEX "WorkerAttendance_status_checkInAt_idx" ON "WorkerAttendance"("status", "checkInAt");

-- CreateIndex
CREATE INDEX "WorkerWorkLog_projectId_date_createdAt_idx" ON "WorkerWorkLog"("projectId", "date", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerWorkLog_workerId_date_idx" ON "WorkerWorkLog"("workerId", "date");

-- CreateIndex
CREATE INDEX "WorkerWorkLog_assignmentId_date_idx" ON "WorkerWorkLog"("assignmentId", "date");

-- CreateIndex
CREATE INDEX "WorkerWorkLog_status_date_idx" ON "WorkerWorkLog"("status", "date");
