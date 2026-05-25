-- CreateEnum
CREATE TYPE "TwoFactorChallengePurpose" AS ENUM (
  'SETUP',
  'LOGIN',
  'DISABLE',
  'RECOVERY_CODES_REGENERATION',
  'SUSPICIOUS_LOGIN'
);

-- CreateTable
CREATE TABLE "UserTwoFactorSettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "emailOtpEnabled" BOOLEAN NOT NULL DEFAULT true,
  "adminEnforced" BOOLEAN NOT NULL DEFAULT false,
  "setupVerifiedAt" TIMESTAMP(3),
  "lastChallengeVerifiedAt" TIMESTAMP(3),
  "lastRecoveryCodeUsedAt" TIMESTAMP(3),
  "lastRecoveryCodesRegeneratedAt" TIMESTAMP(3),
  "failedAttemptCount" INTEGER NOT NULL DEFAULT 0,
  "lockoutUntil" TIMESTAMP(3),
  "recoveryCodesJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserTwoFactorSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTwoFactorChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "settingsId" TEXT,
  "purpose" "TwoFactorChallengePurpose" NOT NULL,
  "deliveryChannel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
  "codeHash" TEXT NOT NULL,
  "emailAddress" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "invalidatedAt" TIMESTAMP(3),
  "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resendCount" INTEGER NOT NULL DEFAULT 0,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserTwoFactorChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTwoFactorSettings_userId_key" ON "UserTwoFactorSettings"("userId");

-- CreateIndex
CREATE INDEX "UserTwoFactorSettings_enabled_adminEnforced_idx" ON "UserTwoFactorSettings"("enabled", "adminEnforced");

-- CreateIndex
CREATE INDEX "UserTwoFactorSettings_lockoutUntil_idx" ON "UserTwoFactorSettings"("lockoutUntil");

-- CreateIndex
CREATE INDEX "UserTwoFactorChallenge_userId_purpose_createdAt_idx" ON "UserTwoFactorChallenge"("userId", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "UserTwoFactorChallenge_settingsId_createdAt_idx" ON "UserTwoFactorChallenge"("settingsId", "createdAt");

-- CreateIndex
CREATE INDEX "UserTwoFactorChallenge_expiresAt_consumedAt_idx" ON "UserTwoFactorChallenge"("expiresAt", "consumedAt");

-- AddForeignKey
ALTER TABLE "UserTwoFactorSettings"
ADD CONSTRAINT "UserTwoFactorSettings_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTwoFactorChallenge"
ADD CONSTRAINT "UserTwoFactorChallenge_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTwoFactorChallenge"
ADD CONSTRAINT "UserTwoFactorChallenge_settingsId_fkey"
FOREIGN KEY ("settingsId") REFERENCES "UserTwoFactorSettings"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
