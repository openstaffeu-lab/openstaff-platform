-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'WORKER', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'PUBLIC_INSTITUTION');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'VERIFIED_CONTRACTOR', 'COMPLIANCE_OFFICER', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "LegalType" AS ENUM ('PF', 'PFA', 'II', 'IF', 'SRL', 'SA');

-- CreateEnum
CREATE TYPE "FirmaStatus" AS ENUM ('ACTIVA', 'INCHISA');

-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('DATA_CENTER', 'PHOTOVOLTAIC', 'HORECA', 'ENVIRONMENT', 'CONSTRUCTION', 'LOGISTICS', 'HEALTHCARE', 'PCB_DESIGN', 'OTHER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'LIVE', 'PAUSED', 'CLOSED', 'DISPUTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'SHORTLISTED', 'OFFER_SENT', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ApplicationDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "HiringPipelineStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContractLifecycleStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "ContractLifecycleEventType" AS ENUM ('CREATED', 'SENT', 'SIGNED', 'ACTIVATED', 'SUSPENDED', 'REACTIVATED', 'TERMINATED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CompensationType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'FIXED_PROJECT');

-- CreateEnum
CREATE TYPE "PayrollCycleStatus" AS ENUM ('OPEN', 'PROCESSING', 'LOCKED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'READY_FOR_PAYMENT', 'PAID');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'MISSED');

-- CreateEnum
CREATE TYPE "WorkSessionSource" AS ENUM ('MANUAL', 'SYSTEM', 'MOBILE');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_SIGN', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CI', 'CAZIER', 'ADEVERINTA_MEDICALA', 'CERTIFICARE', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxonomyType" AS ENUM ('NACE', 'ESCO', 'UNICLASS');

-- CreateEnum
CREATE TYPE "TaxonomyImportEntityType" AS ENUM ('ESCO', 'NACE', 'UNICLASS', 'COUNTRIES', 'REGIONS', 'CITIES', 'VAT', 'CURRENCIES', 'PROFESSIONS', 'CERTIFICATIONS', 'INDUSTRIES', 'PROJECT_CATEGORIES');

-- CreateEnum
CREATE TYPE "TaxonomyImportStatus" AS ENUM ('UPLOADED', 'PARSED', 'VALIDATED', 'READY_TO_COMMIT', 'COMMITTED', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('CHATBOT_PUBLIC', 'ONBOARDING_ASSISTANT', 'PROFILE_COMPLETION_ASSISTANT', 'DOCUMENT_OCR', 'CONTRACT_GENERATOR', 'COMPLIANCE_MONITOR', 'PROJECT_JOB_INTERPRETER', 'PCB_DESIGN_ASSISTANT', 'MATCHING_ENGINE', 'ELIGIBILITY_ENGINE', 'CERTIFICATION_GAP_DETECTOR', 'TEST_FORM_GENERATOR', 'RECOMMENDATION_ENGINE', 'CONTRACT_LIFECYCLE_MONITOR', 'NOTIFICATION_GENERATOR');

-- CreateEnum
CREATE TYPE "ReluAccessMode" AS ENUM ('PUBLIC_LIMITED', 'AUTHENTICATED_USER', 'ADMIN_SECURED');

-- CreateEnum
CREATE TYPE "ReluTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReluSourceType" AS ENUM ('PUBLIC_POST', 'PROFILE', 'PROJECT', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ReluProcessingDomain" AS ENUM ('INGESTION', 'TAXONOMY', 'MATCH', 'MODERATION', 'RECOMMENDATION');

-- CreateEnum
CREATE TYPE "ReluResultStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'REVIEWED', 'OVERRIDDEN');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('READ', 'WRITE', 'DELETE', 'MANAGE_USERS');

-- CreateEnum
CREATE TYPE "ProjectEngagementModel" AS ENUM ('B2B', 'B2C', 'MIXED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectVisibility" AS ENUM ('PRIVATE', 'INVITED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ProjectJobRequestStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_REVIEW', 'FILLED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectConditionType" AS ENUM ('COMMERCIAL', 'LEGAL', 'TECHNICAL', 'SAFETY', 'INSURANCE', 'PAYMENT', 'WARRANTY', 'COMPLIANCE', 'SCHEDULE', 'ACCESS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProjectConditionScope" AS ENUM ('PROJECT', 'JOB_REQUEST');

-- CreateEnum
CREATE TYPE "ProjectAIInterpretationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'OVERRIDDEN');

-- CreateEnum
CREATE TYPE "ProjectDocumentType" AS ENUM ('SCOPE', 'SPECIFICATION', 'BOQ', 'DRAWING', 'CONTRACT', 'PERMIT', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectInvitationStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProjectProposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ProjectContractStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectEscrowStatus" AS ENUM ('NOT_FUNDED', 'PARTIALLY_FUNDED', 'FUNDED', 'RELEASED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectMilestoneStatus" AS ENUM ('DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'RELEASED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ProjectInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectPaymentStatus" AS ENUM ('REQUESTED', 'APPROVED', 'RELEASED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProjectDisputeType" AS ENUM ('MILESTONE', 'INVOICE', 'PAYMENT', 'CONTRACT', 'SAFETY', 'QUALITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectDisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectDisputeSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ProjectDisputeEventType" AS ENUM ('COMMENT', 'STATUS_CHANGE', 'EVIDENCE_ADDED', 'RESOLUTION');

-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('GENERAL_CONTRACTOR', 'CONTRACTOR', 'SUBCONTRACTOR', 'PROFESSIONAL', 'INVESTOR', 'TRAINING_COMPANY', 'SUPERVISOR', 'HSE_SAFETY', 'SUPPLIER', 'SPECIALIST', 'CLINIC_DOCTOR', 'TRAINER_EVALUATOR');

-- CreateEnum
CREATE TYPE "AccountApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AccountLifecycleStatus" AS ENUM ('LIVE', 'OFFLINE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionPlanCode" AS ENUM ('BASIC', 'BRONZE', 'GOLD', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionPlanStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AccountSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BillingEventType" AS ENUM ('SUBSCRIPTION_UPGRADE', 'SUBSCRIPTION_RENEWAL', 'WORKFORCE_SETTLEMENT', 'MANUAL_ADJUSTMENT', 'SUCCESS_FEE', 'DISPUTE_FEE');

-- CreateEnum
CREATE TYPE "BillingEventStatus" AS ENUM ('PENDING', 'ISSUED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettlementBillingStatus" AS ENUM ('NOT_BILLED', 'BILLING_EVENT_CREATED', 'INVOICED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingVatMode" AS ENUM ('DOMESTIC', 'EU_REVERSE_CHARGE', 'EXPORT', 'EXEMPT');

-- CreateEnum
CREATE TYPE "BillingInvoiceType" AS ENUM ('PROFORMA', 'FISCAL');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationCaseSubjectType" AS ENUM ('IDENTITY_PROFILE', 'COMPANY_PROFILE');

-- CreateEnum
CREATE TYPE "VerificationCaseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_INFO');

-- CreateEnum
CREATE TYPE "VerificationDecisionType" AS ENUM ('SUBMIT', 'REQUEST_INFO', 'APPROVE', 'REJECT', 'REOPEN');

-- CreateEnum
CREATE TYPE "VerificationAssetType" AS ENUM ('PROFILE_DOCUMENT', 'ACTOR_DOCUMENT', 'ACTOR_CERTIFICATION', 'MEDICAL_FITNESS_CERTIFICATE');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "BillingInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MANUAL', 'BANK_TRANSFER', 'STRIPE_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "PaymentRecordStatus" AS ENUM ('PENDING', 'RECONCILED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingWebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionRenewalStatus" AS ENUM ('SCHEDULED', 'PROCESSED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'APPROVED_ONLY');

-- CreateEnum
CREATE TYPE "ProfileModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProfileLifecycleStatus" AS ENUM ('LIVE', 'OFFLINE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProfileAvailabilityStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "ProfileDocumentType" AS ENUM ('CV', 'CERTIFICATION', 'PORTFOLIO', 'IMAGE', 'VIDEO', 'LICENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProfileAssetKind" AS ENUM ('LOGO', 'PHOTO', 'BANNER', 'CV', 'PORTFOLIO');

-- CreateEnum
CREATE TYPE "ActorDocumentType" AS ENUM ('COMPANY_DOCUMENT', 'TAX_DOCUMENT', 'INSURANCE_DOCUMENT', 'PROJECT_AUTHORITY_DOCUMENT', 'IDENTITY_DOCUMENT', 'NACE_ACTIVITY_DOCUMENT', 'AUTHORIZATION_DOCUMENT', 'CERTIFICATE_DOCUMENT', 'LICENSE_DOCUMENT', 'TRAINING_DOCUMENT', 'MEDICAL_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ActorCertificationType" AS ENUM ('CERTIFICATE', 'PERMIT', 'LICENSE', 'TRAINING_RECORD', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplianceDocumentStatus" AS ENUM ('PENDING', 'VALID', 'EXPIRED', 'REJECTED', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "MedicalFitnessCategory" AS ENUM ('VISION', 'CARDIOVASCULAR', 'WORK_AT_HEIGHT', 'PSYCHOLOGICAL_FITNESS', 'TRANSMISSIBLE_DISEASES', 'GENERAL_PHYSICAL_FITNESS', 'JOB_SPECIFIC_CLEARANCE');

-- CreateEnum
CREATE TYPE "MedicalFitnessDecision" AS ENUM ('FIT', 'LIMITED', 'UNFIT', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "ComplianceAlertType" AS ENUM ('ONBOARDING_REQUIREMENT', 'DOCUMENT_EXPIRING', 'DOCUMENT_EXPIRED', 'CERTIFICATION_EXPIRING', 'CERTIFICATION_EXPIRED', 'MEDICAL_EXPIRING', 'MEDICAL_EXPIRED', 'CONTRACT_ELIGIBILITY_RISK');

-- CreateEnum
CREATE TYPE "ComplianceAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComplianceAlertStatus" AS ENUM ('PENDING', 'SENT', 'READ', 'RESOLVED');

-- CreateEnum
CREATE TYPE "UserTaskType" AS ENUM ('UPLOAD_CERTIFICATE', 'RENEW_MEDICAL_FITNESS', 'ACCEPT_CONTRACT', 'UPLOAD_INSURANCE', 'COMPLETE_PROFILE', 'REVIEW_PROPOSAL', 'APPROVE_MILESTONE', 'SUBMIT_INVOICE', 'CONFIRM_SITE_ATTENDANCE', 'UPLOAD_PROJECT_REPORT', 'REVIEW_COMPLIANCE');

-- CreateEnum
CREATE TYPE "UserTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UserTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'SMS_PLACEHOLDER', 'PUSH', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('ACCOUNT', 'BILLING', 'VERIFICATION', 'PROJECTS', 'MESSAGING', 'WORKFORCE', 'PAYROLL', 'RELU', 'ADMIN');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('PROJECT', 'CONTRACT', 'DISPUTE', 'DIRECT', 'WORKFORCE', 'PAYROLL', 'RELU', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ConversationParticipantRole" AS ENUM ('OWNER', 'CONTRACTOR', 'WORKER', 'ADMIN', 'SUPERVISOR', 'MEMBER', 'OBSERVER');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SYSTEM', 'FILE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "WorkerEmploymentType" AS ENUM ('EMPLOYEE', 'FREELANCER', 'SUBCONTRACTED', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "WorkerDocumentType" AS ENUM ('IDENTITY', 'CERTIFICATE', 'MEDICAL', 'PERMIT', 'TRAINING', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectWorkerAssignmentStatus" AS ENUM ('PROPOSED', 'APPROVED', 'ACTIVE', 'REMOVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "WorkerAttendanceStatus" AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'MISSED', 'INVALID');

-- CreateEnum
CREATE TYPE "WorkerWorkLogStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkerTimesheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "PublicPostType" AS ENUM ('PROJECT', 'PROFESSIONAL', 'SUBCONTRACTOR_POOL');

-- CreateEnum
CREATE TYPE "PublicPostVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "PublicPostMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "PublicModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "ExternalLinkSecurityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PrivateConversationStatus" AS ENUM ('OPEN', 'CLOSED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "PrivateMessageStatus" AS ENUM ('SENT', 'PENDING_REVIEW', 'FLAGGED');

-- CreateEnum
CREATE TYPE "PublicCommentStatus" AS ENUM ('PUBLISHED', 'PENDING_REVIEW', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "PublicReviewStatus" AS ENUM ('PUBLISHED', 'PENDING_REVIEW', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'TOKEN_REFRESH', 'PASSWORD_RESET', 'MFA_EVENT', 'PERMISSION_DENIED', 'RATE_LIMIT_TRIGGERED', 'SUSPICIOUS_ACTIVITY', 'ADMIN_OVERRIDE', 'DATA_EXPORT', 'ACCOUNT_DELETE_REQUEST');

-- CreateEnum
CREATE TYPE "SecurityEventStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SecurityEventSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComplianceRequestType" AS ENUM ('DATA_EXPORT', 'ACCOUNT_DELETE');

-- CreateEnum
CREATE TYPE "ComplianceRequestStatus" AS ENUM ('PENDING', 'REVIEWED', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Uniclass" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Uniclass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscoSkill" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "EscoSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nace" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Nace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firebaseUid" TEXT,
    "password" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "role" "Role" NOT NULL,
    "approvalStatus" "AccountApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "accountStatus" "AccountLifecycleStatus" NOT NULL DEFAULT 'OFFLINE',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicSlug" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "language" TEXT,
    "timezone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "onboardingCompletedAt" TIMESTAMP(3),
    "profileCompletionPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityCompanyProfile" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "legalName" TEXT,
    "registrationNumber" TEXT,
    "vatId" TEXT,
    "country" TEXT,
    "city" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "postalCode" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityCompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL DEFAULT 'welcome',
    "completedSteps" JSONB,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectType" "VerificationCaseSubjectType" NOT NULL,
    "identityProfileId" TEXT,
    "companyProfileId" TEXT,
    "status" "VerificationCaseStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "latestNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCaseDocument" (
    "id" TEXT NOT NULL,
    "verificationCaseId" TEXT NOT NULL,
    "assetType" "VerificationAssetType" NOT NULL,
    "profileDocumentId" TEXT,
    "actorDocumentId" TEXT,
    "actorCertificationId" TEXT,
    "medicalFitnessCertificateId" TEXT,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDecision" (
    "id" TEXT NOT NULL,
    "verificationCaseId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "decision" "VerificationDecisionType" NOT NULL,
    "fromStatus" "VerificationCaseStatus",
    "toStatus" "VerificationCaseStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" "SubscriptionPlanCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "SubscriptionPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "priceMonthly" INTEGER NOT NULL DEFAULT 0,
    "priceYearly" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanEntitlement" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "limitInt" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "AccountSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "type" "BillingEventType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "BillingEventStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT,
    "vatId" TEXT,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "city" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postalCode" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "isVatPayer" BOOLEAN NOT NULL DEFAULT false,
    "vatMode" "BillingVatMode" NOT NULL DEFAULT 'DOMESTIC',

    CONSTRAINT "BillingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceType" "BillingInvoiceType" NOT NULL DEFAULT 'PROFORMA',
    "status" "BillingInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "fiscalSeries" TEXT,
    "fiscalNumber" TEXT,
    "proformaReference" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "billingEventId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "BillingInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "providerPaymentId" TEXT,
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingWebhookEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalId" TEXT,
    "status" "BillingWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionRenewal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubscriptionRenewalStatus" NOT NULL DEFAULT 'SCHEDULED',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "billingInvoiceId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SubscriptionRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageMeter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "metricKey" TEXT NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_upgrade_requests" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "currentPlanCode" TEXT,
    "requestedPlanCode" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'PRICING',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,

    CONSTRAINT "subscription_upgrade_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permission" "Permission" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UiConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "header" JSONB NOT NULL,
    "homepage" JSONB NOT NULL,
    "footer" JSONB NOT NULL,
    "branding" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomySourceDocumentRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomySourceDocumentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyIndustryRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyIndustryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyCategoryRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industrySlug" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyCategoryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyCertificationRecord" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "category" TEXT,
    "description" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyCertificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyImportBatch" (
    "id" TEXT NOT NULL,
    "entityType" "TaxonomyImportEntityType" NOT NULL,
    "status" "TaxonomyImportStatus" NOT NULL DEFAULT 'UPLOADED',
    "fileName" TEXT NOT NULL,
    "fileMimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdById" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "previewJson" JSONB,
    "errorsJson" JSONB,
    "duplicateSummaryJson" JSONB,
    "parsedRowsJson" JSONB,
    "validationSummaryJson" JSONB,
    "commitSummaryJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "committedAt" TIMESTAMP(3),

    CONSTRAINT "TaxonomyImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyProfessionRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industrySlug" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "labelsJson" JSONB NOT NULL,
    "descriptionsJson" JSONB NOT NULL,
    "tagsJson" JSONB NOT NULL,
    "skillsJson" JSONB NOT NULL,
    "mappingsJson" JSONB NOT NULL,
    "referencesJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyProfessionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "authorUserId" TEXT,
    "authorProfileId" TEXT,
    "type" "PublicPostType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "moderationStatus" "PublicModerationStatus" NOT NULL DEFAULT 'PENDING',
    "bannerUrl" TEXT,
    "summary" TEXT,
    "experienceLabel" TEXT,
    "value" TEXT NOT NULL,
    "currencyCode" TEXT,
    "vatRate" DOUBLE PRECISION,
    "fiscalMetadataJson" JSONB,
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "certificationsOffered" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "classificationJson" JSONB NOT NULL,
    "escoCodesJson" TEXT,
    "naceCodesJson" TEXT,
    "uniclassCodesJson" TEXT,
    "languageCodesJson" TEXT,
    "documentsJson" TEXT,
    "countryId" TEXT,
    "regionId" TEXT,
    "cityId" TEXT,
    "certifications" TEXT NOT NULL,
    "visibility" "PublicPostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicPostMedia" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "PublicPostMediaType" NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GALLERY',
    "alt" TEXT,
    "status" "PublicModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicPostMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicPostDocument" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageBucket" TEXT,
    "storageKey" TEXT NOT NULL,
    "status" "PublicModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicPostDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalLinkSubmission" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "sourcePostId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "securityStatus" "ExternalLinkSecurityStatus" NOT NULL DEFAULT 'PENDING',
    "reasonsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalLinkSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateConversation" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "status" "PrivateConversationStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "PrivateMessageStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "PublicCommentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicReview" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER,
    "review" TEXT NOT NULL,
    "status" "PublicReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "scopeOfWork" TEXT,
    "engagementModel" "ProjectEngagementModel" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PRIVATE',
    "location" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "countryId" TEXT,
    "regionId" TEXT,
    "cityId" TEXT,
    "primaryLanguageId" TEXT,
    "budgetMinCents" INTEGER,
    "budgetMaxCents" INTEGER,
    "currencyCode" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "responseDeadline" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectJobRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scopeOfWork" TEXT,
    "status" "ProjectJobRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "workerCount" INTEGER,
    "unit" TEXT,
    "budgetMinCents" INTEGER,
    "budgetMaxCents" INTEGER,
    "currencyCode" TEXT,
    "requiredExperienceYears" INTEGER,
    "requiresCertification" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "responseDeadline" TIMESTAMP(3),
    "languageId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectJobRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCondition" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jobRequestId" TEXT,
    "type" "ProjectConditionType" NOT NULL,
    "scope" "ProjectConditionScope" NOT NULL DEFAULT 'PROJECT',
    "title" TEXT NOT NULL,
    "clauseKey" TEXT,
    "content" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAIInterpretation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "ProjectAIInterpretationStatus" NOT NULL DEFAULT 'PENDING',
    "sourceText" TEXT,
    "extractedJson" TEXT,
    "documentIds" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "modelName" TEXT,
    "modelVersion" TEXT,
    "promptVersion" TEXT,
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAIInterpretation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jobRequestId" TEXT,
    "uploadedById" TEXT,
    "type" "ProjectDocumentType" NOT NULL,
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
    "extractedAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "profileType" "ProfileType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "companyName" TEXT,
    "publicHeadline" TEXT,
    "description" TEXT,
    "summary" TEXT,
    "websiteUrl" TEXT,
    "publicEmail" TEXT,
    "publicPhone" TEXT,
    "privateEmail" TEXT,
    "privatePhone" TEXT,
    "privateNotes" TEXT,
    "companyRegistrationNumber" TEXT,
    "taxNumber" TEXT,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "moderationStatus" "ProfileModerationStatus" NOT NULL DEFAULT 'PENDING',
    "status" "ProfileLifecycleStatus" NOT NULL DEFAULT 'OFFLINE',
    "logoUrl" TEXT,
    "photoUrl" TEXT,
    "bannerUrl" TEXT,
    "cvUrl" TEXT,
    "portfolioUrlsJson" TEXT,
    "approvalNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "countryId" TEXT,
    "regionId" TEXT,
    "cityId" TEXT,
    "supportedEngagementModels" TEXT,
    "certificationsText" TEXT,
    "availabilityStatus" "ProfileAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorProfile" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "tradeFocus" TEXT,
    "teamSize" INTEGER,
    "serviceArea" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalProfile" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "headline" TEXT,
    "yearsExperience" INTEGER,
    "portfolioFocus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileLanguage" (
    "profileId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileLanguage_pkey" PRIMARY KEY ("profileId","languageId")
);

-- CreateTable
CREATE TABLE "ProfileDocument" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "type" "ProfileDocumentType" NOT NULL,
    "assetKind" "ProfileAssetKind",
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
    "extractedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectShortlist" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "matchScore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectShortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectInvitation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "ProjectInvitationStatus" NOT NULL DEFAULT 'DRAFT',
    "message" TEXT,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectProposal" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "invitationId" TEXT,
    "submittedById" TEXT NOT NULL,
    "status" "ProjectProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "message" TEXT,
    "priceCents" INTEGER,
    "currencyCode" TEXT,
    "estimatedStartDate" TIMESTAMP(3),
    "estimatedEndDate" TIMESTAMP(3),
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectContract" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "ProjectContractStatus" NOT NULL DEFAULT 'DRAFT',
    "contractType" "ProjectEngagementModel" NOT NULL,
    "title" TEXT NOT NULL,
    "scopeSummary" TEXT,
    "commercialTerms" TEXT,
    "paymentTerms" TEXT,
    "safetyTerms" TEXT,
    "insuranceTerms" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectEscrowAccount" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "status" "ProjectEscrowStatus" NOT NULL DEFAULT 'NOT_FUNDED',
    "currencyCode" TEXT,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "fundedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "releasedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectEscrowAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "status" "ProjectMilestoneStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectInvoice" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "profileId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "ProjectInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
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

    CONSTRAINT "ProjectInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPayment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "escrowAccountId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "status" "ProjectPaymentStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDispute" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "openedById" TEXT NOT NULL,
    "againstProfileId" TEXT,
    "type" "ProjectDisputeType" NOT NULL,
    "status" "ProjectDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "ProjectDisputeSeverity" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDisputeEvent" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "type" "ProjectDisputeEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDisputeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "appliesTo" "ProjectEngagementModel" NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL,
    "withholdingRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "socialContributionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employerContributionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractFinancialSnapshot" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "countryId" TEXT,
    "contractType" "ProjectEngagementModel" NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractFinancialSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActorDocument" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileDocumentId" TEXT,
    "type" "ActorDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "ComplianceDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActorCertification" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorDocumentId" TEXT,
    "type" "ActorCertificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "ComplianceDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "escoSkillId" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActorCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalFitnessCertificate" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorDocumentId" TEXT,
    "category" "MedicalFitnessCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "issuedByProfileId" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "ComplianceDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "fitnessDecision" "MedicalFitnessDecision" NOT NULL DEFAULT 'REQUIRES_REVIEW',
    "jobSpecificClearance" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalFitnessCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceAlert" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "projectId" TEXT,
    "contractId" TEXT,
    "actorDocumentId" TEXT,
    "actorCertificationId" TEXT,
    "medicalFitnessCertificateId" TEXT,
    "type" "ComplianceAlertType" NOT NULL,
    "severity" "ComplianceAlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "ComplianceAlertStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ComplianceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTask" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "assignedToUserId" TEXT NOT NULL,
    "projectId" TEXT,
    "contractId" TEXT,
    "profileId" TEXT,
    "actorDocumentId" TEXT,
    "actorCertificationId" TEXT,
    "medicalFitnessCertificateId" TEXT,
    "type" "UserTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "UserTaskStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "UserTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetUserId" TEXT,
    "projectId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "category" TEXT,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "metadataJson" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "reviewedByUserId" TEXT,
    "type" "SecurityEventType" NOT NULL,
    "category" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "status" "SecurityEventStatus" NOT NULL DEFAULT 'PENDING',
    "severity" "SecurityEventSeverity" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDeviceFingerprint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDeviceFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userDeviceFingerprintId" TEXT,
    "refreshTokenHash" TEXT,
    "refreshTokenFamily" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceLabel" TEXT,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "type" "ComplianceRequestType" NOT NULL,
    "status" "ComplianceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "secureDownloadToken" TEXT,
    "exportData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "eventId" TEXT,
    "userId" TEXT,
    "profileId" TEXT,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "category" "NotificationCategory",
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "key" TEXT,
    "eventType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "category" "NotificationCategory",
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "eventId" TEXT,
    "userId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "categoryPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'SYSTEM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAutomationRun" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "eventId" TEXT,
    "triggeredByUserId" TEXT,
    "reviewedByUserId" TEXT,
    "status" TEXT NOT NULL,
    "inputSnapshot" JSONB,
    "outputData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowAutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "publicPostId" TEXT,
    "contractId" TEXT,
    "disputeId" TEXT,
    "workforceAssignmentId" TEXT,
    "payrollCycleId" TEXT,
    "payrollSettlementId" TEXT,
    "reluRecommendationId" TEXT,
    "type" "ConversationType" NOT NULL,
    "title" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ConversationParticipantRole" NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "mutedAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "typingStartedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "removedByUserId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "content" TEXT NOT NULL,
    "metadataJson" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedByUserId" TEXT,
    "moderationStatus" "PublicModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "moderatedAt" TIMESTAMP(3),
    "moderatedByUserId" TEXT,
    "moderationNotes" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageBucket" TEXT,
    "storageKey" TEXT NOT NULL,
    "canPreview" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublicModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNotes" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actor" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "actorType" "ActorType" NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'RO',
    "regionCode" TEXT,
    "languageCode" TEXT NOT NULL DEFAULT 'ro',
    "vatNumber" TEXT,
    "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'RON',
    "naceCode" TEXT,
    "naceDescription" TEXT,
    "escoOccupations" TEXT[],
    "uniclassCode" TEXT,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "experienceYears" INTEGER,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "role" "PlatformRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalType" "LegalType" NOT NULL,
    "cui" TEXT NOT NULL,
    "cnp" TEXT,
    "seriesCi" TEXT,
    "ciFileUrl" TEXT,
    "administrator" TEXT,
    "capitalSocial" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'RON',
    "nrAngajati" INTEGER,
    "experientaSimilara" TEXT,
    "statusFirma" "FirmaStatus" NOT NULL DEFAULT 'ACTIVA',
    "contBancar" TEXT,
    "adresa" TEXT,
    "obiectActivitate" TEXT[],
    "experientaMunca" INTEGER,
    "cazierUrl" TEXT,
    "adeverintaMedicalaUrl" TEXT,
    "certificariUrls" TEXT[],
    "serviciiIds" TEXT[],

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "actorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "JobCategory" NOT NULL,
    "naceCode" TEXT,
    "escoRequired" TEXT[],
    "uniclassCode" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "location" TEXT,
    "regionCode" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'RO',
    "currency" TEXT NOT NULL DEFAULT 'RON',
    "budget" DECIMAL(15,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "mediaUrls" TEXT[],
    "reluProcessed" BOOLEAN NOT NULL DEFAULT false,
    "reluSummary" TEXT,
    "reluTestForm" JSONB,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "candidateUserId" TEXT,
    "status" "AppStatus" NOT NULL DEFAULT 'PENDING',
    "currentStage" "ApplicationStage" NOT NULL DEFAULT 'APPLIED',
    "reluScore" DOUBLE PRECISION,
    "message" TEXT,
    "stageChangedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringPipeline" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "HiringPipelineStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalApplicants" INTEGER NOT NULL DEFAULT 0,
    "totalShortlisted" INTEGER NOT NULL DEFAULT 0,
    "totalHired" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HiringPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStageHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStage" "ApplicationStage",
    "toStage" "ApplicationStage" NOT NULL,
    "changedByUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringDecision" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "decision" "ApplicationDecision" NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiringDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "lifecycleStatus" "ContractLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "value" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RON',
    "transactionFee" DECIMAL(15,2),
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "jobId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL,
    "workforceAssignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetEntry" (
    "id" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimesheetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "workforceAssignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL,
    "checkOutAt" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL,
    "source" "WorkSessionSource" NOT NULL DEFAULT 'MANUAL',
    "locationMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompensationAgreement" (
    "id" TEXT NOT NULL,
    "workforceAssignmentId" TEXT NOT NULL,
    "compensationType" "CompensationType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RON',
    "baseRate" DECIMAL(15,2) NOT NULL,
    "overtimeRate" DECIMAL(15,2),
    "overtimeThresholdHours" DOUBLE PRECISION,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompensationAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollCycle" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayrollCycleStatus" NOT NULL DEFAULT 'OPEN',
    "totalWorkers" INTEGER NOT NULL DEFAULT 0,
    "totalGrossAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollSettlement" (
    "id" TEXT NOT NULL,
    "payrollCycleId" TEXT NOT NULL,
    "workforceAssignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approvedTimesheetIds" JSONB NOT NULL,
    "regularHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deductionsAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'RON',
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "paidAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollSettlementLine" (
    "id" TEXT NOT NULL,
    "payrollSettlementId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitRate" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollSettlementLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceBillingLink" (
    "id" TEXT NOT NULL,
    "payrollSettlementId" TEXT NOT NULL,
    "billingEventId" TEXT NOT NULL,
    "billingInvoiceId" TEXT,
    "status" "SettlementBillingStatus" NOT NULL DEFAULT 'NOT_BILLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceBillingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractLifecycleEvent" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "eventType" "ContractLifecycleEventType" NOT NULL,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractLifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractId" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "fee" DECIMAL(15,2),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromActorId" TEXT NOT NULL,
    "toActorId" TEXT NOT NULL,
    "jobId" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Taxonomy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "TaxonomyType" NOT NULL,
    "label" TEXT NOT NULL,
    "labelEn" TEXT,
    "parentId" TEXT,

    CONSTRAINT "Taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeminiAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gemini-1.5-pro-latest',
    "description" TEXT,
    "accessMode" "ReluAccessMode" NOT NULL DEFAULT 'AUTHENTICATED_USER',
    "systemPrompt" TEXT NOT NULL,
    "policyJson" JSONB,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "publicEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxContextItems" INTEGER NOT NULL DEFAULT 12,
    "webhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeminiAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReluTask" (
    "id" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "accessMode" "ReluAccessMode" NOT NULL,
    "status" "ReluTaskStatus" NOT NULL DEFAULT 'PENDING',
    "requestedByUserId" TEXT,
    "contextEntityType" TEXT,
    "contextEntityId" TEXT,
    "title" TEXT NOT NULL,
    "inputSummaryJson" JSONB,
    "resultSummaryJson" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReluTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReluProcessingRun" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "sourceType" "ReluSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT,
    "triggeredByUserId" TEXT,
    "domain" "ReluProcessingDomain" NOT NULL,
    "status" "ReluResultStatus" NOT NULL DEFAULT 'PENDING',
    "inputSnapshot" JSONB,
    "outputData" JSONB,
    "score" DOUBLE PRECISION,
    "explanation" TEXT,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReluProcessingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReluClassificationResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "sourceType" "ReluSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT,
    "reviewedByUserId" TEXT,
    "domain" "ReluProcessingDomain" NOT NULL,
    "status" "ReluResultStatus" NOT NULL DEFAULT 'PENDING',
    "inputSnapshot" JSONB,
    "outputData" JSONB,
    "score" DOUBLE PRECISION,
    "explanation" TEXT,
    "overrideData" JSONB,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ReluClassificationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReluMatchResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "sourceType" "ReluSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT,
    "reviewedByUserId" TEXT,
    "targetSourceType" "ReluSourceType",
    "targetSourceId" TEXT,
    "domain" "ReluProcessingDomain" NOT NULL,
    "status" "ReluResultStatus" NOT NULL DEFAULT 'PENDING',
    "inputSnapshot" JSONB,
    "outputData" JSONB,
    "score" DOUBLE PRECISION,
    "compatibilityPercent" DOUBLE PRECISION,
    "explanation" TEXT,
    "overrideData" JSONB,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ReluMatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReluRecommendation" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "sourceType" "ReluSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT,
    "reviewedByUserId" TEXT,
    "targetSourceType" "ReluSourceType",
    "targetSourceId" TEXT,
    "domain" "ReluProcessingDomain" NOT NULL,
    "status" "ReluResultStatus" NOT NULL DEFAULT 'PENDING',
    "inputSnapshot" JSONB,
    "outputData" JSONB,
    "score" DOUBLE PRECISION,
    "explanation" TEXT,
    "recommendedAction" TEXT,
    "overrideData" JSONB,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ReluRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileWorker" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "roleTitle" TEXT NOT NULL,
    "employmentType" "WorkerEmploymentType" NOT NULL,
    "status" "WorkerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerDocument" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "type" "WorkerDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "ComplianceDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "medicalCategory" "MedicalFitnessCategory",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerSkill" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "escoSkillId" TEXT,
    "title" TEXT NOT NULL,
    "level" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectWorkerAssignment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT,
    "jobRequestId" TEXT,
    "profileId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" "ProjectWorkerAssignmentStatus" NOT NULL DEFAULT 'PROPOSED',
    "assignedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectWorkerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAttendance" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT,
    "jobRequestId" TEXT,
    "workerId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "checkInAt" TIMESTAMP(3) NOT NULL,
    "checkOutAt" TIMESTAMP(3),
    "status" "WorkerAttendanceStatus" NOT NULL,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerWorkLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jobRequestId" TEXT,
    "workerId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "status" "WorkerWorkLogStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerWorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerTimesheet" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT,
    "profileId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "WorkerTimesheetStatus" NOT NULL DEFAULT 'DRAFT',
    "totalHours" DOUBLE PRECISION NOT NULL,
    "regularHours" DOUBLE PRECISION NOT NULL,
    "overtimeHours" DOUBLE PRECISION NOT NULL,
    "approvedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerTimesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerPayrollCalculation" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "WorkerPayrollCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileEscoClassification" (
    "profileId" TEXT NOT NULL,
    "escoSkillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileEscoClassification_pkey" PRIMARY KEY ("profileId","escoSkillId")
);

-- CreateTable
CREATE TABLE "ProfileNaceClassification" (
    "profileId" TEXT NOT NULL,
    "naceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileNaceClassification_pkey" PRIMARY KEY ("profileId","naceId")
);

-- CreateTable
CREATE TABLE "ProfileUniclassClassification" (
    "profileId" TEXT NOT NULL,
    "uniclassId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileUniclassClassification_pkey" PRIMARY KEY ("profileId","uniclassId")
);

-- CreateTable
CREATE TABLE "ProjectEscoClassification" (
    "projectId" TEXT NOT NULL,
    "escoSkillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectEscoClassification_pkey" PRIMARY KEY ("projectId","escoSkillId")
);

-- CreateTable
CREATE TABLE "ProjectNaceClassification" (
    "projectId" TEXT NOT NULL,
    "naceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectNaceClassification_pkey" PRIMARY KEY ("projectId","naceId")
);

-- CreateTable
CREATE TABLE "ProjectUniclassClassification" (
    "projectId" TEXT NOT NULL,
    "uniclassId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectUniclassClassification_pkey" PRIMARY KEY ("projectId","uniclassId")
);

-- CreateTable
CREATE TABLE "ProjectJobRequestEscoClassification" (
    "jobRequestId" TEXT NOT NULL,
    "escoSkillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectJobRequestEscoClassification_pkey" PRIMARY KEY ("jobRequestId","escoSkillId")
);

-- CreateTable
CREATE TABLE "ProjectJobRequestNaceClassification" (
    "jobRequestId" TEXT NOT NULL,
    "naceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectJobRequestNaceClassification_pkey" PRIMARY KEY ("jobRequestId","naceId")
);

-- CreateTable
CREATE TABLE "ProjectJobRequestUniclassClassification" (
    "jobRequestId" TEXT NOT NULL,
    "uniclassId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectJobRequestUniclassClassification_pkey" PRIMARY KEY ("jobRequestId","uniclassId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE INDEX "Region_countryId_idx" ON "Region"("countryId");

-- CreateIndex
CREATE INDEX "City_regionId_idx" ON "City"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Uniclass_code_key" ON "Uniclass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EscoSkill_code_key" ON "EscoSkill"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Nace_code_key" ON "Nace"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityProfile_userId_key" ON "IdentityProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityProfile_publicSlug_key" ON "IdentityProfile"("publicSlug");

-- CreateIndex
CREATE INDEX "IdentityProfile_verificationStatus_createdAt_idx" ON "IdentityProfile"("verificationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "IdentityProfile_profileCompletionPercent_idx" ON "IdentityProfile"("profileCompletionPercent");

-- CreateIndex
CREATE INDEX "IdentityCompanyProfile_ownerUserId_createdAt_idx" ON "IdentityCompanyProfile"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "IdentityCompanyProfile_verificationStatus_createdAt_idx" ON "IdentityCompanyProfile"("verificationStatus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSession_userId_key" ON "OnboardingSession"("userId");

-- CreateIndex
CREATE INDEX "OnboardingSession_status_completionPercent_idx" ON "OnboardingSession"("status", "completionPercent");

-- CreateIndex
CREATE INDEX "VerificationCase_userId_subjectType_status_idx" ON "VerificationCase"("userId", "subjectType", "status");

-- CreateIndex
CREATE INDEX "VerificationCase_identityProfileId_status_idx" ON "VerificationCase"("identityProfileId", "status");

-- CreateIndex
CREATE INDEX "VerificationCase_companyProfileId_status_idx" ON "VerificationCase"("companyProfileId", "status");

-- CreateIndex
CREATE INDEX "VerificationCase_reviewedById_reviewedAt_idx" ON "VerificationCase"("reviewedById", "reviewedAt");

-- CreateIndex
CREATE INDEX "VerificationCaseDocument_verificationCaseId_assetType_idx" ON "VerificationCaseDocument"("verificationCaseId", "assetType");

-- CreateIndex
CREATE INDEX "VerificationCaseDocument_profileDocumentId_idx" ON "VerificationCaseDocument"("profileDocumentId");

-- CreateIndex
CREATE INDEX "VerificationCaseDocument_actorDocumentId_idx" ON "VerificationCaseDocument"("actorDocumentId");

-- CreateIndex
CREATE INDEX "VerificationCaseDocument_actorCertificationId_idx" ON "VerificationCaseDocument"("actorCertificationId");

-- CreateIndex
CREATE INDEX "VerificationCaseDocument_medicalFitnessCertificateId_idx" ON "VerificationCaseDocument"("medicalFitnessCertificateId");

-- CreateIndex
CREATE INDEX "VerificationDecision_verificationCaseId_createdAt_idx" ON "VerificationDecision"("verificationCaseId", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationDecision_actorUserId_createdAt_idx" ON "VerificationDecision"("actorUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_status_displayOrder_idx" ON "SubscriptionPlan"("status", "displayOrder");

-- CreateIndex
CREATE INDEX "PlanEntitlement_featureKey_idx" ON "PlanEntitlement"("featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "PlanEntitlement_planId_featureKey_key" ON "PlanEntitlement"("planId", "featureKey");

-- CreateIndex
CREATE INDEX "AccountSubscription_userId_status_startedAt_idx" ON "AccountSubscription"("userId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "AccountSubscription_planId_status_idx" ON "AccountSubscription"("planId", "status");

-- CreateIndex
CREATE INDEX "BillingEvent_userId_createdAt_idx" ON "BillingEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingEvent_subscriptionId_createdAt_idx" ON "BillingEvent"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingEvent_type_status_createdAt_idx" ON "BillingEvent"("type", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingProfile_userId_key" ON "BillingProfile"("userId");

-- CreateIndex
CREATE INDEX "BillingProfile_country_vatMode_idx" ON "BillingProfile"("country", "vatMode");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInvoice_invoiceNumber_key" ON "BillingInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "BillingInvoice_userId_createdAt_idx" ON "BillingInvoice"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingInvoice_subscriptionId_createdAt_idx" ON "BillingInvoice"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingInvoice_status_issuedAt_idx" ON "BillingInvoice"("status", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInvoiceLine_billingEventId_key" ON "BillingInvoiceLine"("billingEventId");

-- CreateIndex
CREATE INDEX "BillingInvoiceLine_invoiceId_idx" ON "BillingInvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentRecord_userId_createdAt_idx" ON "PaymentRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentRecord_invoiceId_createdAt_idx" ON "PaymentRecord"("invoiceId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentRecord_provider_status_createdAt_idx" ON "PaymentRecord"("provider", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_provider_createdAt_idx" ON "BillingWebhookEvent"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_status_createdAt_idx" ON "BillingWebhookEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_externalId_idx" ON "BillingWebhookEvent"("externalId");

-- CreateIndex
CREATE INDEX "SubscriptionRenewal_subscriptionId_periodStart_periodEnd_idx" ON "SubscriptionRenewal"("subscriptionId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "SubscriptionRenewal_userId_createdAt_idx" ON "SubscriptionRenewal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionRenewal_status_scheduledAt_idx" ON "SubscriptionRenewal"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "UsageMeter_subscriptionId_idx" ON "UsageMeter"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "UsageMeter_userId_metricKey_key" ON "UsageMeter"("userId", "metricKey");

-- CreateIndex
CREATE INDEX "subscription_upgrade_requests_createdAt_idx" ON "subscription_upgrade_requests"("createdAt");

-- CreateIndex
CREATE INDEX "subscription_upgrade_requests_requestedPlanCode_createdAt_idx" ON "subscription_upgrade_requests"("requestedPlanCode", "createdAt");

-- CreateIndex
CREATE INDEX "subscription_upgrade_requests_status_createdAt_idx" ON "subscription_upgrade_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "subscription_upgrade_requests_userId_createdAt_idx" ON "subscription_upgrade_requests"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RolePermission_role_enabled_idx" ON "RolePermission"("role", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permission_key" ON "RolePermission"("role", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "UiConfig_key_key" ON "UiConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomySourceDocumentRecord_key_key" ON "TaxonomySourceDocumentRecord"("key");

-- CreateIndex
CREATE INDEX "TaxonomySourceDocumentRecord_source_locale_idx" ON "TaxonomySourceDocumentRecord"("source", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyIndustryRecord_key_key" ON "TaxonomyIndustryRecord"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyIndustryRecord_slug_key" ON "TaxonomyIndustryRecord"("slug");

-- CreateIndex
CREATE INDEX "TaxonomyIndustryRecord_slug_idx" ON "TaxonomyIndustryRecord"("slug");

-- CreateIndex
CREATE INDEX "TaxonomyIndustryRecord_source_idx" ON "TaxonomyIndustryRecord"("source");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyCategoryRecord_key_key" ON "TaxonomyCategoryRecord"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyCategoryRecord_slug_key" ON "TaxonomyCategoryRecord"("slug");

-- CreateIndex
CREATE INDEX "TaxonomyCategoryRecord_industrySlug_slug_idx" ON "TaxonomyCategoryRecord"("industrySlug", "slug");

-- CreateIndex
CREATE INDEX "TaxonomyCategoryRecord_source_idx" ON "TaxonomyCategoryRecord"("source");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyCertificationRecord_code_key" ON "TaxonomyCertificationRecord"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyCertificationRecord_slug_key" ON "TaxonomyCertificationRecord"("slug");

-- CreateIndex
CREATE INDEX "TaxonomyCertificationRecord_category_name_idx" ON "TaxonomyCertificationRecord"("category", "name");

-- CreateIndex
CREATE INDEX "TaxonomyCertificationRecord_source_idx" ON "TaxonomyCertificationRecord"("source");

-- CreateIndex
CREATE INDEX "TaxonomyImportBatch_entityType_createdAt_idx" ON "TaxonomyImportBatch"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "TaxonomyImportBatch_status_createdAt_idx" ON "TaxonomyImportBatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TaxonomyImportBatch_createdById_createdAt_idx" ON "TaxonomyImportBatch"("createdById", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyProfessionRecord_key_key" ON "TaxonomyProfessionRecord"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyProfessionRecord_slug_key" ON "TaxonomyProfessionRecord"("slug");

-- CreateIndex
CREATE INDEX "TaxonomyProfessionRecord_industrySlug_categorySlug_idx" ON "TaxonomyProfessionRecord"("industrySlug", "categorySlug");

-- CreateIndex
CREATE INDEX "TaxonomyProfessionRecord_source_idx" ON "TaxonomyProfessionRecord"("source");

-- CreateIndex
CREATE UNIQUE INDEX "PublicPost_slug_key" ON "PublicPost"("slug");

-- CreateIndex
CREATE INDEX "PublicPost_type_visibility_createdAt_idx" ON "PublicPost"("type", "visibility", "createdAt");

-- CreateIndex
CREATE INDEX "PublicPost_status_moderationStatus_createdAt_idx" ON "PublicPost"("status", "moderationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "PublicPost_authorUserId_createdAt_idx" ON "PublicPost"("authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PublicPost_authorProfileId_createdAt_idx" ON "PublicPost"("authorProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "PublicPost_countryId_regionId_cityId_idx" ON "PublicPost"("countryId", "regionId", "cityId");

-- CreateIndex
CREATE INDEX "PublicPostMedia_postId_status_createdAt_idx" ON "PublicPostMedia"("postId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PublicPostDocument_postId_status_createdAt_idx" ON "PublicPostDocument"("postId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ExternalLinkSubmission_sourcePostId_createdAt_idx" ON "ExternalLinkSubmission"("sourcePostId", "createdAt");

-- CreateIndex
CREATE INDEX "ExternalLinkSubmission_securityStatus_createdAt_idx" ON "ExternalLinkSubmission"("securityStatus", "createdAt");

-- CreateIndex
CREATE INDEX "PrivateConversation_postId_createdAt_idx" ON "PrivateConversation"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "PrivateConversation_status_createdAt_idx" ON "PrivateConversation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PrivateMessage_conversationId_createdAt_idx" ON "PrivateMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "PrivateMessage_status_createdAt_idx" ON "PrivateMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PublicComment_postId_createdAt_idx" ON "PublicComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "PublicComment_status_createdAt_idx" ON "PublicComment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PublicReview_postId_createdAt_idx" ON "PublicReview"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "PublicReview_status_createdAt_idx" ON "PublicReview"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_createdById_createdAt_idx" ON "Project"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "Project_status_engagementModel_idx" ON "Project"("status", "engagementModel");

-- CreateIndex
CREATE INDEX "Project_countryId_regionId_cityId_idx" ON "Project"("countryId", "regionId", "cityId");

-- CreateIndex
CREATE INDEX "ProjectJobRequest_projectId_status_idx" ON "ProjectJobRequest"("projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectJobRequest_languageId_idx" ON "ProjectJobRequest"("languageId");

-- CreateIndex
CREATE INDEX "ProjectCondition_projectId_scope_sortOrder_idx" ON "ProjectCondition"("projectId", "scope", "sortOrder");

-- CreateIndex
CREATE INDEX "ProjectCondition_jobRequestId_idx" ON "ProjectCondition"("jobRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAIInterpretation_projectId_key" ON "ProjectAIInterpretation"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAIInterpretation_status_idx" ON "ProjectAIInterpretation"("status");

-- CreateIndex
CREATE INDEX "ProjectAIInterpretation_reviewedById_idx" ON "ProjectAIInterpretation"("reviewedById");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_type_idx" ON "ProjectDocument"("projectId", "type");

-- CreateIndex
CREATE INDEX "ProjectDocument_jobRequestId_idx" ON "ProjectDocument"("jobRequestId");

-- CreateIndex
CREATE INDEX "ProjectDocument_uploadedById_idx" ON "ProjectDocument"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_slug_key" ON "Profile"("slug");

-- CreateIndex
CREATE INDEX "Profile_profileType_idx" ON "Profile"("profileType");

-- CreateIndex
CREATE INDEX "Profile_countryId_regionId_cityId_idx" ON "Profile"("countryId", "regionId", "cityId");

-- CreateIndex
CREATE INDEX "Profile_availabilityStatus_idx" ON "Profile"("availabilityStatus");

-- CreateIndex
CREATE INDEX "Profile_visibility_moderationStatus_status_idx" ON "Profile"("visibility", "moderationStatus", "status");

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

-- CreateIndex
CREATE INDEX "ProjectContract_projectId_status_createdAt_idx" ON "ProjectContract"("projectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectContract_profileId_status_createdAt_idx" ON "ProjectContract"("profileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectContract_createdById_idx" ON "ProjectContract"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectContract_proposalId_key" ON "ProjectContract"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectEscrowAccount_contractId_key" ON "ProjectEscrowAccount"("contractId");

-- CreateIndex
CREATE INDEX "ProjectEscrowAccount_projectId_status_createdAt_idx" ON "ProjectEscrowAccount"("projectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_contractId_status_idx" ON "ProjectMilestone"("projectId", "contractId", "status");

-- CreateIndex
CREATE INDEX "ProjectMilestone_contractId_createdAt_idx" ON "ProjectMilestone"("contractId", "createdAt");

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

-- CreateIndex
CREATE INDEX "ActorDocument_profileId_type_status_idx" ON "ActorDocument"("profileId", "type", "status");

-- CreateIndex
CREATE INDEX "ActorDocument_userId_status_idx" ON "ActorDocument"("userId", "status");

-- CreateIndex
CREATE INDEX "ActorDocument_expiresAt_idx" ON "ActorDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "ActorDocument_verifiedById_idx" ON "ActorDocument"("verifiedById");

-- CreateIndex
CREATE INDEX "ActorCertification_profileId_type_status_idx" ON "ActorCertification"("profileId", "type", "status");

-- CreateIndex
CREATE INDEX "ActorCertification_userId_status_idx" ON "ActorCertification"("userId", "status");

-- CreateIndex
CREATE INDEX "ActorCertification_escoSkillId_idx" ON "ActorCertification"("escoSkillId");

-- CreateIndex
CREATE INDEX "ActorCertification_expiresAt_idx" ON "ActorCertification"("expiresAt");

-- CreateIndex
CREATE INDEX "ActorCertification_verifiedById_idx" ON "ActorCertification"("verifiedById");

-- CreateIndex
CREATE INDEX "MedicalFitnessCertificate_profileId_category_status_idx" ON "MedicalFitnessCertificate"("profileId", "category", "status");

-- CreateIndex
CREATE INDEX "MedicalFitnessCertificate_userId_status_idx" ON "MedicalFitnessCertificate"("userId", "status");

-- CreateIndex
CREATE INDEX "MedicalFitnessCertificate_issuedByProfileId_idx" ON "MedicalFitnessCertificate"("issuedByProfileId");

-- CreateIndex
CREATE INDEX "MedicalFitnessCertificate_expiresAt_idx" ON "MedicalFitnessCertificate"("expiresAt");

-- CreateIndex
CREATE INDEX "MedicalFitnessCertificate_verifiedById_idx" ON "MedicalFitnessCertificate"("verifiedById");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceAlert_key_key" ON "ComplianceAlert"("key");

-- CreateIndex
CREATE INDEX "ComplianceAlert_userId_status_createdAt_idx" ON "ComplianceAlert"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceAlert_profileId_status_idx" ON "ComplianceAlert"("profileId", "status");

-- CreateIndex
CREATE INDEX "ComplianceAlert_projectId_status_idx" ON "ComplianceAlert"("projectId", "status");

-- CreateIndex
CREATE INDEX "ComplianceAlert_contractId_status_idx" ON "ComplianceAlert"("contractId", "status");

-- CreateIndex
CREATE INDEX "ComplianceAlert_dueDate_status_idx" ON "ComplianceAlert"("dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_key_key" ON "UserTask"("key");

-- CreateIndex
CREATE INDEX "UserTask_assignedToUserId_status_dueDate_idx" ON "UserTask"("assignedToUserId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "UserTask_projectId_status_idx" ON "UserTask"("projectId", "status");

-- CreateIndex
CREATE INDEX "UserTask_contractId_status_idx" ON "UserTask"("contractId", "status");

-- CreateIndex
CREATE INDEX "UserTask_profileId_status_idx" ON "UserTask"("profileId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetUserId_createdAt_idx" ON "AuditLog"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_category_createdAt_idx" ON "AuditLog"("category", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_createdAt_idx" ON "AuditLog"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_projectId_createdAt_idx" ON "AuditLog"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_category_createdAt_idx" ON "SecurityEvent"("category", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_createdAt_idx" ON "SecurityEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_status_createdAt_idx" ON "SecurityEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "UserDeviceFingerprint_userId_lastSeenAt_idx" ON "UserDeviceFingerprint"("userId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserDeviceFingerprint_userId_fingerprintHash_key" ON "UserDeviceFingerprint"("userId", "fingerprintHash");

-- CreateIndex
CREATE INDEX "UserSession_userId_lastActivityAt_idx" ON "UserSession"("userId", "lastActivityAt");

-- CreateIndex
CREATE INDEX "UserSession_userDeviceFingerprintId_lastActivityAt_idx" ON "UserSession"("userDeviceFingerprintId", "lastActivityAt");

-- CreateIndex
CREATE INDEX "UserSession_revokedAt_lastActivityAt_idx" ON "UserSession"("revokedAt", "lastActivityAt");

-- CreateIndex
CREATE INDEX "ComplianceRequest_userId_createdAt_idx" ON "ComplianceRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceRequest_status_createdAt_idx" ON "ComplianceRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceRequest_type_createdAt_idx" ON "ComplianceRequest"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_key_key" ON "Notification"("key");

-- CreateIndex
CREATE INDEX "Notification_userId_status_createdAt_idx" ON "Notification"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_profileId_status_createdAt_idx" ON "Notification"("profileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_actorId_status_createdAt_idx" ON "Notification"("actorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_scheduledFor_status_idx" ON "Notification"("scheduledFor", "status");

-- CreateIndex
CREATE INDEX "Notification_eventId_status_createdAt_idx" ON "Notification"("eventId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationEvent_key_key" ON "NotificationEvent"("key");

-- CreateIndex
CREATE INDEX "NotificationEvent_userId_status_createdAt_idx" ON "NotificationEvent"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_sourceType_sourceId_createdAt_idx" ON "NotificationEvent"("sourceType", "sourceId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_eventType_status_createdAt_idx" ON "NotificationEvent"("eventType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_status_createdAt_idx" ON "NotificationDelivery"("notificationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_eventId_status_createdAt_idx" ON "NotificationDelivery"("eventId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_userId_status_createdAt_idx" ON "NotificationDelivery"("userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRule_eventType_isActive_idx" ON "WorkflowAutomationRule"("eventType", "isActive");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRun_ruleId_createdAt_idx" ON "WorkflowAutomationRun"("ruleId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRun_eventId_createdAt_idx" ON "WorkflowAutomationRun"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowAutomationRun_status_createdAt_idx" ON "WorkflowAutomationRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_projectId_type_createdAt_idx" ON "Conversation"("projectId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_publicPostId_type_createdAt_idx" ON "Conversation"("publicPostId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_contractId_type_createdAt_idx" ON "Conversation"("contractId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_disputeId_type_createdAt_idx" ON "Conversation"("disputeId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_workforceAssignmentId_type_createdAt_idx" ON "Conversation"("workforceAssignmentId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_payrollCycleId_type_createdAt_idx" ON "Conversation"("payrollCycleId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_payrollSettlementId_type_createdAt_idx" ON "Conversation"("payrollSettlementId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_reluRecommendationId_type_createdAt_idx" ON "Conversation"("reluRecommendationId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_type_lastMessageAt_createdAt_idx" ON "Conversation"("type", "lastMessageAt", "createdAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_joinedAt_idx" ON "ConversationParticipant"("userId", "joinedAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_conversationId_unreadCount_lastRead_idx" ON "ConversationParticipant"("conversationId", "unreadCount", "lastReadAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_removedByUserId_removedAt_idx" ON "ConversationParticipant"("removedByUserId", "removedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_status_createdAt_idx" ON "Message"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Message_moderationStatus_createdAt_idx" ON "Message"("moderationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Message_deletedByUserId_deletedAt_idx" ON "Message"("deletedByUserId", "deletedAt");

-- CreateIndex
CREATE INDEX "Message_moderatedByUserId_moderatedAt_idx" ON "Message"("moderatedByUserId", "moderatedAt");

-- CreateIndex
CREATE INDEX "MessageRead_userId_readAt_idx" ON "MessageRead"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId", "userId");

-- CreateIndex
CREATE INDEX "MessageAttachment_conversationId_createdAt_idx" ON "MessageAttachment"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_createdAt_idx" ON "MessageAttachment"("messageId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageAttachment_uploaderId_createdAt_idx" ON "MessageAttachment"("uploaderId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageAttachment_status_createdAt_idx" ON "MessageAttachment"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Actor_firebaseUid_key" ON "Actor"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "Actor_email_key" ON "Actor"("email");

-- CreateIndex
CREATE INDEX "Actor_actorType_createdAt_idx" ON "Actor"("actorType", "createdAt");

-- CreateIndex
CREATE INDEX "Actor_countryCode_regionCode_idx" ON "Actor"("countryCode", "regionCode");

-- CreateIndex
CREATE INDEX "Actor_isVerified_createdAt_idx" ON "Actor"("isVerified", "createdAt");

-- CreateIndex
CREATE INDEX "Actor_role_createdAt_idx" ON "Actor"("role", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_actorId_key" ON "CompanyProfile"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_cui_key" ON "CompanyProfile"("cui");

-- CreateIndex
CREATE INDEX "Job_actorId_status_createdAt_idx" ON "Job"("actorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Job_category_status_createdAt_idx" ON "Job"("category", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Job_regionCode_status_createdAt_idx" ON "Job"("regionCode", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Application_candidateUserId_createdAt_idx" ON "Application"("candidateUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Application_actorId_status_createdAt_idx" ON "Application"("actorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Application_jobId_currentStage_createdAt_idx" ON "Application"("jobId", "currentStage", "createdAt");

-- CreateIndex
CREATE INDEX "Application_jobId_status_createdAt_idx" ON "Application"("jobId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_actorId_key" ON "Application"("jobId", "actorId");

-- CreateIndex
CREATE UNIQUE INDEX "HiringPipeline_jobId_key" ON "HiringPipeline"("jobId");

-- CreateIndex
CREATE INDEX "HiringPipeline_status_updatedAt_idx" ON "HiringPipeline"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ApplicationStageHistory_applicationId_createdAt_idx" ON "ApplicationStageHistory"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationStageHistory_changedByUserId_createdAt_idx" ON "ApplicationStageHistory"("changedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "HiringDecision_applicationId_createdAt_idx" ON "HiringDecision"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "HiringDecision_decidedByUserId_createdAt_idx" ON "HiringDecision"("decidedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "HiringDecision_decision_createdAt_idx" ON "HiringDecision"("decision", "createdAt");

-- CreateIndex
CREATE INDEX "Contract_jobId_status_createdAt_idx" ON "Contract"("jobId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Contract_jobId_lifecycleStatus_createdAt_idx" ON "Contract"("jobId", "lifecycleStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Contract_employerId_status_createdAt_idx" ON "Contract"("employerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Contract_contractorId_status_createdAt_idx" ON "Contract"("contractorId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkforceAssignment_applicationId_key" ON "WorkforceAssignment"("applicationId");

-- CreateIndex
CREATE INDEX "WorkforceAssignment_userId_status_assignedAt_idx" ON "WorkforceAssignment"("userId", "status", "assignedAt");

-- CreateIndex
CREATE INDEX "WorkforceAssignment_projectId_status_assignedAt_idx" ON "WorkforceAssignment"("projectId", "status", "assignedAt");

-- CreateIndex
CREATE INDEX "WorkforceAssignment_jobId_status_assignedAt_idx" ON "WorkforceAssignment"("jobId", "status", "assignedAt");

-- CreateIndex
CREATE INDEX "WorkforceAssignment_contractId_status_assignedAt_idx" ON "WorkforceAssignment"("contractId", "status", "assignedAt");

-- CreateIndex
CREATE INDEX "Timesheet_userId_status_periodStart_periodEnd_idx" ON "Timesheet"("userId", "status", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "Timesheet_projectId_status_periodStart_periodEnd_idx" ON "Timesheet"("projectId", "status", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "Timesheet_approvedByUserId_approvedAt_idx" ON "Timesheet"("approvedByUserId", "approvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Timesheet_workforceAssignmentId_periodStart_periodEnd_key" ON "Timesheet"("workforceAssignmentId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "TimesheetEntry_timesheetId_workDate_idx" ON "TimesheetEntry"("timesheetId", "workDate");

-- CreateIndex
CREATE INDEX "AttendanceRecord_workforceAssignmentId_checkInAt_idx" ON "AttendanceRecord"("workforceAssignmentId", "checkInAt");

-- CreateIndex
CREATE INDEX "AttendanceRecord_userId_checkInAt_idx" ON "AttendanceRecord"("userId", "checkInAt");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_checkInAt_idx" ON "AttendanceRecord"("status", "checkInAt");

-- CreateIndex
CREATE INDEX "CompensationAgreement_workforceAssignmentId_effectiveFrom_idx" ON "CompensationAgreement"("workforceAssignmentId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "CompensationAgreement_compensationType_effectiveFrom_idx" ON "CompensationAgreement"("compensationType", "effectiveFrom");

-- CreateIndex
CREATE INDEX "PayrollCycle_status_periodStart_periodEnd_idx" ON "PayrollCycle"("status", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollCycle_periodStart_periodEnd_key" ON "PayrollCycle"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "PayrollSettlement_payrollCycleId_status_createdAt_idx" ON "PayrollSettlement"("payrollCycleId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PayrollSettlement_workforceAssignmentId_createdAt_idx" ON "PayrollSettlement"("workforceAssignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "PayrollSettlement_userId_createdAt_idx" ON "PayrollSettlement"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PayrollSettlementLine_payrollSettlementId_createdAt_idx" ON "PayrollSettlementLine"("payrollSettlementId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkforceBillingLink_payrollSettlementId_key" ON "WorkforceBillingLink"("payrollSettlementId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkforceBillingLink_billingEventId_key" ON "WorkforceBillingLink"("billingEventId");

-- CreateIndex
CREATE INDEX "WorkforceBillingLink_status_createdAt_idx" ON "WorkforceBillingLink"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WorkforceBillingLink_billingInvoiceId_createdAt_idx" ON "WorkforceBillingLink"("billingInvoiceId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractLifecycleEvent_contractId_createdAt_idx" ON "ContractLifecycleEvent"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractLifecycleEvent_eventType_createdAt_idx" ON "ContractLifecycleEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "ContractLifecycleEvent_actorUserId_createdAt_idx" ON "ContractLifecycleEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Dispute_contractId_status_createdAt_idx" ON "Dispute"("contractId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Review_fromActorId_createdAt_idx" ON "Review"("fromActorId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_toActorId_createdAt_idx" ON "Review"("toActorId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_jobId_createdAt_idx" ON "Review"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "Document_actorId_type_createdAt_idx" ON "Document"("actorId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Document_verified_createdAt_idx" ON "Document"("verified", "createdAt");

-- CreateIndex
CREATE INDEX "Taxonomy_type_label_idx" ON "Taxonomy"("type", "label");

-- CreateIndex
CREATE INDEX "Taxonomy_parentId_idx" ON "Taxonomy"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Taxonomy_code_type_key" ON "Taxonomy"("code", "type");

-- CreateIndex
CREATE INDEX "GeminiAgent_type_enabled_idx" ON "GeminiAgent"("type", "enabled");

-- CreateIndex
CREATE INDEX "GeminiAgent_accessMode_enabled_idx" ON "GeminiAgent"("accessMode", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "GeminiAgent_name_type_key" ON "GeminiAgent"("name", "type");

-- CreateIndex
CREATE INDEX "ReluTask_status_createdAt_idx" ON "ReluTask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ReluTask_accessMode_createdAt_idx" ON "ReluTask"("accessMode", "createdAt");

-- CreateIndex
CREATE INDEX "ReluTask_requestedByUserId_createdAt_idx" ON "ReluTask"("requestedByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReluProcessingRun_taskId_key" ON "ReluProcessingRun"("taskId");

-- CreateIndex
CREATE INDEX "ReluProcessingRun_sourceType_sourceId_createdAt_idx" ON "ReluProcessingRun"("sourceType", "sourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ReluProcessingRun_domain_status_createdAt_idx" ON "ReluProcessingRun"("domain", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReluProcessingRun_triggeredByUserId_createdAt_idx" ON "ReluProcessingRun"("triggeredByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ReluProcessingRun_userId_createdAt_idx" ON "ReluProcessingRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReluClassificationResult_sourceType_sourceId_createdAt_idx" ON "ReluClassificationResult"("sourceType", "sourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ReluClassificationResult_domain_status_createdAt_idx" ON "ReluClassificationResult"("domain", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReluClassificationResult_userId_createdAt_idx" ON "ReluClassificationResult"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReluMatchResult_sourceType_sourceId_createdAt_idx" ON "ReluMatchResult"("sourceType", "sourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ReluMatchResult_targetSourceType_targetSourceId_createdAt_idx" ON "ReluMatchResult"("targetSourceType", "targetSourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ReluMatchResult_domain_status_createdAt_idx" ON "ReluMatchResult"("domain", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReluMatchResult_userId_createdAt_idx" ON "ReluMatchResult"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReluRecommendation_sourceType_sourceId_createdAt_idx" ON "ReluRecommendation"("sourceType", "sourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ReluRecommendation_targetSourceType_targetSourceId_createdA_idx" ON "ReluRecommendation"("targetSourceType", "targetSourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ReluRecommendation_domain_status_createdAt_idx" ON "ReluRecommendation"("domain", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReluRecommendation_userId_createdAt_idx" ON "ReluRecommendation"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "ProfileWorker_profileId_status_createdAt_idx" ON "ProfileWorker"("profileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileWorker_userId_idx" ON "ProfileWorker"("userId");

-- CreateIndex
CREATE INDEX "WorkerDocument_workerId_type_status_idx" ON "WorkerDocument"("workerId", "type", "status");

-- CreateIndex
CREATE INDEX "WorkerDocument_expiresAt_idx" ON "WorkerDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "WorkerSkill_workerId_createdAt_idx" ON "WorkerSkill"("workerId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerSkill_escoSkillId_idx" ON "WorkerSkill"("escoSkillId");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_projectId_status_assignedAt_idx" ON "ProjectWorkerAssignment"("projectId", "status", "assignedAt");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_contractId_status_idx" ON "ProjectWorkerAssignment"("contractId", "status");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_jobRequestId_status_idx" ON "ProjectWorkerAssignment"("jobRequestId", "status");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_profileId_status_idx" ON "ProjectWorkerAssignment"("profileId", "status");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_workerId_status_idx" ON "ProjectWorkerAssignment"("workerId", "status");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_assignedById_assignedAt_idx" ON "ProjectWorkerAssignment"("assignedById", "assignedAt");

-- CreateIndex
CREATE INDEX "ProjectWorkerAssignment_approvedById_approvedAt_idx" ON "ProjectWorkerAssignment"("approvedById", "approvedAt");

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

-- CreateIndex
CREATE INDEX "ProfileEscoClassification_escoSkillId_idx" ON "ProfileEscoClassification"("escoSkillId");

-- CreateIndex
CREATE INDEX "ProfileNaceClassification_naceId_idx" ON "ProfileNaceClassification"("naceId");

-- CreateIndex
CREATE INDEX "ProfileUniclassClassification_uniclassId_idx" ON "ProfileUniclassClassification"("uniclassId");

-- CreateIndex
CREATE INDEX "ProjectEscoClassification_escoSkillId_idx" ON "ProjectEscoClassification"("escoSkillId");

-- CreateIndex
CREATE INDEX "ProjectNaceClassification_naceId_idx" ON "ProjectNaceClassification"("naceId");

-- CreateIndex
CREATE INDEX "ProjectUniclassClassification_uniclassId_idx" ON "ProjectUniclassClassification"("uniclassId");

-- CreateIndex
CREATE INDEX "ProjectJobRequestEscoClassification_escoSkillId_idx" ON "ProjectJobRequestEscoClassification"("escoSkillId");

-- CreateIndex
CREATE INDEX "ProjectJobRequestNaceClassification_naceId_idx" ON "ProjectJobRequestNaceClassification"("naceId");

-- CreateIndex
CREATE INDEX "ProjectJobRequestUniclassClassification_uniclassId_idx" ON "ProjectJobRequestUniclassClassification"("uniclassId");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityProfile" ADD CONSTRAINT "IdentityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityCompanyProfile" ADD CONSTRAINT "IdentityCompanyProfile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingSession" ADD CONSTRAINT "OnboardingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCase" ADD CONSTRAINT "VerificationCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCase" ADD CONSTRAINT "VerificationCase_identityProfileId_fkey" FOREIGN KEY ("identityProfileId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCase" ADD CONSTRAINT "VerificationCase_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "IdentityCompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCase" ADD CONSTRAINT "VerificationCase_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCaseDocument" ADD CONSTRAINT "VerificationCaseDocument_verificationCaseId_fkey" FOREIGN KEY ("verificationCaseId") REFERENCES "VerificationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCaseDocument" ADD CONSTRAINT "VerificationCaseDocument_profileDocumentId_fkey" FOREIGN KEY ("profileDocumentId") REFERENCES "ProfileDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCaseDocument" ADD CONSTRAINT "VerificationCaseDocument_actorDocumentId_fkey" FOREIGN KEY ("actorDocumentId") REFERENCES "ActorDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCaseDocument" ADD CONSTRAINT "VerificationCaseDocument_actorCertificationId_fkey" FOREIGN KEY ("actorCertificationId") REFERENCES "ActorCertification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCaseDocument" ADD CONSTRAINT "VerificationCaseDocument_medicalFitnessCertificateId_fkey" FOREIGN KEY ("medicalFitnessCertificateId") REFERENCES "MedicalFitnessCertificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDecision" ADD CONSTRAINT "VerificationDecision_verificationCaseId_fkey" FOREIGN KEY ("verificationCaseId") REFERENCES "VerificationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDecision" ADD CONSTRAINT "VerificationDecision_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEntitlement" ADD CONSTRAINT "PlanEntitlement_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountSubscription" ADD CONSTRAINT "AccountSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountSubscription" ADD CONSTRAINT "AccountSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AccountSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingProfile" ADD CONSTRAINT "BillingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AccountSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoiceLine" ADD CONSTRAINT "BillingInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoiceLine" ADD CONSTRAINT "BillingInvoiceLine_billingEventId_fkey" FOREIGN KEY ("billingEventId") REFERENCES "BillingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRenewal" ADD CONSTRAINT "SubscriptionRenewal_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AccountSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRenewal" ADD CONSTRAINT "SubscriptionRenewal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRenewal" ADD CONSTRAINT "SubscriptionRenewal_billingInvoiceId_fkey" FOREIGN KEY ("billingInvoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageMeter" ADD CONSTRAINT "UsageMeter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageMeter" ADD CONSTRAINT "UsageMeter_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AccountSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_upgrade_requests" ADD CONSTRAINT "subscription_upgrade_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxonomyImportBatch" ADD CONSTRAINT "TaxonomyImportBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicPost" ADD CONSTRAINT "PublicPost_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicPost" ADD CONSTRAINT "PublicPost_authorProfileId_fkey" FOREIGN KEY ("authorProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicPost" ADD CONSTRAINT "PublicPost_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicPost" ADD CONSTRAINT "PublicPost_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicPost" ADD CONSTRAINT "PublicPost_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicPostMedia" ADD CONSTRAINT "PublicPostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PublicPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicPostDocument" ADD CONSTRAINT "PublicPostDocument_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PublicPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalLinkSubmission" ADD CONSTRAINT "ExternalLinkSubmission_sourcePostId_fkey" FOREIGN KEY ("sourcePostId") REFERENCES "PublicPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateConversation" ADD CONSTRAINT "PrivateConversation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PublicPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessage" ADD CONSTRAINT "PrivateMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "PrivateConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PublicPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicReview" ADD CONSTRAINT "PublicReview_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PublicPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_primaryLanguageId_fkey" FOREIGN KEY ("primaryLanguageId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectJobRequest" ADD CONSTRAINT "ProjectJobRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectJobRequest" ADD CONSTRAINT "ProjectJobRequest_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCondition" ADD CONSTRAINT "ProjectCondition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCondition" ADD CONSTRAINT "ProjectCondition_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAIInterpretation" ADD CONSTRAINT "ProjectAIInterpretation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAIInterpretation" ADD CONSTRAINT "ProjectAIInterpretation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorProfile" ADD CONSTRAINT "ContractorProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalProfile" ADD CONSTRAINT "ProfessionalProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLanguage" ADD CONSTRAINT "ProfileLanguage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLanguage" ADD CONSTRAINT "ProfileLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileDocument" ADD CONSTRAINT "ProfileDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileDocument" ADD CONSTRAINT "ProfileDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectShortlist" ADD CONSTRAINT "ProjectShortlist_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectShortlist" ADD CONSTRAINT "ProjectShortlist_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectShortlist" ADD CONSTRAINT "ProjectShortlist_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectProposal" ADD CONSTRAINT "ProjectProposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectProposal" ADD CONSTRAINT "ProjectProposal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectProposal" ADD CONSTRAINT "ProjectProposal_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ProjectInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectProposal" ADD CONSTRAINT "ProjectProposal_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContract" ADD CONSTRAINT "ProjectContract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContract" ADD CONSTRAINT "ProjectContract_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ProjectProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContract" ADD CONSTRAINT "ProjectContract_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContract" ADD CONSTRAINT "ProjectContract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEscrowAccount" ADD CONSTRAINT "ProjectEscrowAccount_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEscrowAccount" ADD CONSTRAINT "ProjectEscrowAccount_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvoice" ADD CONSTRAINT "ProjectInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvoice" ADD CONSTRAINT "ProjectInvoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvoice" ADD CONSTRAINT "ProjectInvoice_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvoice" ADD CONSTRAINT "ProjectInvoice_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvoice" ADD CONSTRAINT "ProjectInvoice_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPayment" ADD CONSTRAINT "ProjectPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPayment" ADD CONSTRAINT "ProjectPayment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPayment" ADD CONSTRAINT "ProjectPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ProjectInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPayment" ADD CONSTRAINT "ProjectPayment_escrowAccountId_fkey" FOREIGN KEY ("escrowAccountId") REFERENCES "ProjectEscrowAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPayment" ADD CONSTRAINT "ProjectPayment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDispute" ADD CONSTRAINT "ProjectDispute_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDispute" ADD CONSTRAINT "ProjectDispute_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDispute" ADD CONSTRAINT "ProjectDispute_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDispute" ADD CONSTRAINT "ProjectDispute_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ProjectInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDispute" ADD CONSTRAINT "ProjectDispute_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ProjectPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDispute" ADD CONSTRAINT "ProjectDispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDispute" ADD CONSTRAINT "ProjectDispute_againstProfileId_fkey" FOREIGN KEY ("againstProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDisputeEvent" ADD CONSTRAINT "ProjectDisputeEvent_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "ProjectDispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDisputeEvent" ADD CONSTRAINT "ProjectDisputeEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxRule" ADD CONSTRAINT "TaxRule_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractFinancialSnapshot" ADD CONSTRAINT "ContractFinancialSnapshot_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractFinancialSnapshot" ADD CONSTRAINT "ContractFinancialSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractFinancialSnapshot" ADD CONSTRAINT "ContractFinancialSnapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractFinancialSnapshot" ADD CONSTRAINT "ContractFinancialSnapshot_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorDocument" ADD CONSTRAINT "ActorDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorDocument" ADD CONSTRAINT "ActorDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorDocument" ADD CONSTRAINT "ActorDocument_profileDocumentId_fkey" FOREIGN KEY ("profileDocumentId") REFERENCES "ProfileDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorDocument" ADD CONSTRAINT "ActorDocument_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorCertification" ADD CONSTRAINT "ActorCertification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorCertification" ADD CONSTRAINT "ActorCertification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorCertification" ADD CONSTRAINT "ActorCertification_actorDocumentId_fkey" FOREIGN KEY ("actorDocumentId") REFERENCES "ActorDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorCertification" ADD CONSTRAINT "ActorCertification_escoSkillId_fkey" FOREIGN KEY ("escoSkillId") REFERENCES "EscoSkill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorCertification" ADD CONSTRAINT "ActorCertification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFitnessCertificate" ADD CONSTRAINT "MedicalFitnessCertificate_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFitnessCertificate" ADD CONSTRAINT "MedicalFitnessCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFitnessCertificate" ADD CONSTRAINT "MedicalFitnessCertificate_actorDocumentId_fkey" FOREIGN KEY ("actorDocumentId") REFERENCES "ActorDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFitnessCertificate" ADD CONSTRAINT "MedicalFitnessCertificate_issuedByProfileId_fkey" FOREIGN KEY ("issuedByProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFitnessCertificate" ADD CONSTRAINT "MedicalFitnessCertificate_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_actorDocumentId_fkey" FOREIGN KEY ("actorDocumentId") REFERENCES "ActorDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_actorCertificationId_fkey" FOREIGN KEY ("actorCertificationId") REFERENCES "ActorCertification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_medicalFitnessCertificateId_fkey" FOREIGN KEY ("medicalFitnessCertificateId") REFERENCES "MedicalFitnessCertificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_actorDocumentId_fkey" FOREIGN KEY ("actorDocumentId") REFERENCES "ActorDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_actorCertificationId_fkey" FOREIGN KEY ("actorCertificationId") REFERENCES "ActorCertification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_medicalFitnessCertificateId_fkey" FOREIGN KEY ("medicalFitnessCertificateId") REFERENCES "MedicalFitnessCertificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDeviceFingerprint" ADD CONSTRAINT "UserDeviceFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userDeviceFingerprintId_fkey" FOREIGN KEY ("userDeviceFingerprintId") REFERENCES "UserDeviceFingerprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRequest" ADD CONSTRAINT "ComplianceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRequest" ADD CONSTRAINT "ComplianceRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NotificationEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NotificationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAutomationRun" ADD CONSTRAINT "WorkflowAutomationRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "WorkflowAutomationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAutomationRun" ADD CONSTRAINT "WorkflowAutomationRun_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NotificationEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAutomationRun" ADD CONSTRAINT "WorkflowAutomationRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAutomationRun" ADD CONSTRAINT "WorkflowAutomationRun_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_publicPostId_fkey" FOREIGN KEY ("publicPostId") REFERENCES "PublicPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "ProjectDispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_workforceAssignmentId_fkey" FOREIGN KEY ("workforceAssignmentId") REFERENCES "WorkforceAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_payrollCycleId_fkey" FOREIGN KEY ("payrollCycleId") REFERENCES "PayrollCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_payrollSettlementId_fkey" FOREIGN KEY ("payrollSettlementId") REFERENCES "PayrollSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_reluRecommendationId_fkey" FOREIGN KEY ("reluRecommendationId") REFERENCES "ReluRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_removedByUserId_fkey" FOREIGN KEY ("removedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_moderatedByUserId_fkey" FOREIGN KEY ("moderatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_moderatedByUserId_fkey" FOREIGN KEY ("moderatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringPipeline" ADD CONSTRAINT "HiringPipeline_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStageHistory" ADD CONSTRAINT "ApplicationStageHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStageHistory" ADD CONSTRAINT "ApplicationStageHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringDecision" ADD CONSTRAINT "HiringDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringDecision" ADD CONSTRAINT "HiringDecision_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceAssignment" ADD CONSTRAINT "WorkforceAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceAssignment" ADD CONSTRAINT "WorkforceAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceAssignment" ADD CONSTRAINT "WorkforceAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceAssignment" ADD CONSTRAINT "WorkforceAssignment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceAssignment" ADD CONSTRAINT "WorkforceAssignment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_workforceAssignmentId_fkey" FOREIGN KEY ("workforceAssignmentId") REFERENCES "WorkforceAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_workforceAssignmentId_fkey" FOREIGN KEY ("workforceAssignmentId") REFERENCES "WorkforceAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationAgreement" ADD CONSTRAINT "CompensationAgreement_workforceAssignmentId_fkey" FOREIGN KEY ("workforceAssignmentId") REFERENCES "WorkforceAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSettlement" ADD CONSTRAINT "PayrollSettlement_payrollCycleId_fkey" FOREIGN KEY ("payrollCycleId") REFERENCES "PayrollCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSettlement" ADD CONSTRAINT "PayrollSettlement_workforceAssignmentId_fkey" FOREIGN KEY ("workforceAssignmentId") REFERENCES "WorkforceAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSettlement" ADD CONSTRAINT "PayrollSettlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSettlement" ADD CONSTRAINT "PayrollSettlement_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSettlementLine" ADD CONSTRAINT "PayrollSettlementLine_payrollSettlementId_fkey" FOREIGN KEY ("payrollSettlementId") REFERENCES "PayrollSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceBillingLink" ADD CONSTRAINT "WorkforceBillingLink_payrollSettlementId_fkey" FOREIGN KEY ("payrollSettlementId") REFERENCES "PayrollSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceBillingLink" ADD CONSTRAINT "WorkforceBillingLink_billingEventId_fkey" FOREIGN KEY ("billingEventId") REFERENCES "BillingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceBillingLink" ADD CONSTRAINT "WorkforceBillingLink_billingInvoiceId_fkey" FOREIGN KEY ("billingInvoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLifecycleEvent" ADD CONSTRAINT "ContractLifecycleEvent_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLifecycleEvent" ADD CONSTRAINT "ContractLifecycleEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_fromActorId_fkey" FOREIGN KEY ("fromActorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_toActorId_fkey" FOREIGN KEY ("toActorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Taxonomy" ADD CONSTRAINT "Taxonomy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Taxonomy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluTask" ADD CONSTRAINT "ReluTask_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluProcessingRun" ADD CONSTRAINT "ReluProcessingRun_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ReluTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluProcessingRun" ADD CONSTRAINT "ReluProcessingRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluProcessingRun" ADD CONSTRAINT "ReluProcessingRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluClassificationResult" ADD CONSTRAINT "ReluClassificationResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReluProcessingRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluClassificationResult" ADD CONSTRAINT "ReluClassificationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluClassificationResult" ADD CONSTRAINT "ReluClassificationResult_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluMatchResult" ADD CONSTRAINT "ReluMatchResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReluProcessingRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluMatchResult" ADD CONSTRAINT "ReluMatchResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluMatchResult" ADD CONSTRAINT "ReluMatchResult_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluRecommendation" ADD CONSTRAINT "ReluRecommendation_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReluProcessingRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluRecommendation" ADD CONSTRAINT "ReluRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReluRecommendation" ADD CONSTRAINT "ReluRecommendation_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileWorker" ADD CONSTRAINT "ProfileWorker_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileWorker" ADD CONSTRAINT "ProfileWorker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDocument" ADD CONSTRAINT "WorkerDocument_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerSkill" ADD CONSTRAINT "WorkerSkill_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerSkill" ADD CONSTRAINT "WorkerSkill_escoSkillId_fkey" FOREIGN KEY ("escoSkillId") REFERENCES "EscoSkill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkerAssignment" ADD CONSTRAINT "ProjectWorkerAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkerAssignment" ADD CONSTRAINT "ProjectWorkerAssignment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkerAssignment" ADD CONSTRAINT "ProjectWorkerAssignment_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkerAssignment" ADD CONSTRAINT "ProjectWorkerAssignment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkerAssignment" ADD CONSTRAINT "ProjectWorkerAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkerAssignment" ADD CONSTRAINT "ProjectWorkerAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkerAssignment" ADD CONSTRAINT "ProjectWorkerAssignment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ProjectWorkerAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerWorkLog" ADD CONSTRAINT "WorkerWorkLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerWorkLog" ADD CONSTRAINT "WorkerWorkLog_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerWorkLog" ADD CONSTRAINT "WorkerWorkLog_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerWorkLog" ADD CONSTRAINT "WorkerWorkLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ProjectWorkerAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerTimesheet" ADD CONSTRAINT "WorkerTimesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerTimesheet" ADD CONSTRAINT "WorkerTimesheet_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerTimesheet" ADD CONSTRAINT "WorkerTimesheet_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerTimesheet" ADD CONSTRAINT "WorkerTimesheet_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerTimesheet" ADD CONSTRAINT "WorkerTimesheet_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPayrollCalculation" ADD CONSTRAINT "WorkerPayrollCalculation_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "WorkerTimesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPayrollCalculation" ADD CONSTRAINT "WorkerPayrollCalculation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPayrollCalculation" ADD CONSTRAINT "WorkerPayrollCalculation_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ProjectContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPayrollCalculation" ADD CONSTRAINT "WorkerPayrollCalculation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPayrollCalculation" ADD CONSTRAINT "WorkerPayrollCalculation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "ProfileWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileEscoClassification" ADD CONSTRAINT "ProfileEscoClassification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileEscoClassification" ADD CONSTRAINT "ProfileEscoClassification_escoSkillId_fkey" FOREIGN KEY ("escoSkillId") REFERENCES "EscoSkill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileNaceClassification" ADD CONSTRAINT "ProfileNaceClassification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileNaceClassification" ADD CONSTRAINT "ProfileNaceClassification_naceId_fkey" FOREIGN KEY ("naceId") REFERENCES "Nace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileUniclassClassification" ADD CONSTRAINT "ProfileUniclassClassification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileUniclassClassification" ADD CONSTRAINT "ProfileUniclassClassification_uniclassId_fkey" FOREIGN KEY ("uniclassId") REFERENCES "Uniclass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEscoClassification" ADD CONSTRAINT "ProjectEscoClassification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEscoClassification" ADD CONSTRAINT "ProjectEscoClassification_escoSkillId_fkey" FOREIGN KEY ("escoSkillId") REFERENCES "EscoSkill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNaceClassification" ADD CONSTRAINT "ProjectNaceClassification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNaceClassification" ADD CONSTRAINT "ProjectNaceClassification_naceId_fkey" FOREIGN KEY ("naceId") REFERENCES "Nace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUniclassClassification" ADD CONSTRAINT "ProjectUniclassClassification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUniclassClassification" ADD CONSTRAINT "ProjectUniclassClassification_uniclassId_fkey" FOREIGN KEY ("uniclassId") REFERENCES "Uniclass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectJobRequestEscoClassification" ADD CONSTRAINT "ProjectJobRequestEscoClassification_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectJobRequestEscoClassification" ADD CONSTRAINT "ProjectJobRequestEscoClassification_escoSkillId_fkey" FOREIGN KEY ("escoSkillId") REFERENCES "EscoSkill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectJobRequestNaceClassification" ADD CONSTRAINT "ProjectJobRequestNaceClassification_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectJobRequestNaceClassification" ADD CONSTRAINT "ProjectJobRequestNaceClassification_naceId_fkey" FOREIGN KEY ("naceId") REFERENCES "Nace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectJobRequestUniclassClassification" ADD CONSTRAINT "ProjectJobRequestUniclassClassification_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "ProjectJobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectJobRequestUniclassClassification" ADD CONSTRAINT "ProjectJobRequestUniclassClassification_uniclassId_fkey" FOREIGN KEY ("uniclassId") REFERENCES "Uniclass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

