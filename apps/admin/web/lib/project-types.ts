export type ProjectStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type EngagementModel = "B2B" | "B2C" | "MIXED";

export type AIInterpretationDetectedEngagementModel = EngagementModel | "UNKNOWN";

export type JobRequestStatus =
  | "DRAFT"
  | "OPEN"
  | "IN_REVIEW"
  | "FILLED"
  | "CLOSED"
  | "CANCELLED";

export type ConditionType =
  | "COMMERCIAL"
  | "LEGAL"
  | "TECHNICAL"
  | "SAFETY"
  | "INSURANCE"
  | "PAYMENT"
  | "WARRANTY"
  | "COMPLIANCE"
  | "SCHEDULE"
  | "ACCESS"
  | "CUSTOM";

export type AIInterpretationStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "OVERRIDDEN";

export type ProjectDocumentType =
  | "SCOPE"
  | "SPECIFICATION"
  | "BOQ"
  | "DRAWING"
  | "CONTRACT"
  | "PERMIT"
  | "IMAGE"
  | "OTHER";

export type ProfileType =
  | "GENERAL_CONTRACTOR"
  | "CONTRACTOR"
  | "SUBCONTRACTOR"
  | "PROFESSIONAL"
  | "SUPERVISOR"
  | "SPECIALIST"
  | "CLINIC_DOCTOR"
  | "TRAINER_EVALUATOR";
export type ProfileAvailabilityStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
export type ProfileDocumentType =
  | "CV"
  | "CERTIFICATION"
  | "PORTFOLIO"
  | "IMAGE"
  | "VIDEO"
  | "LICENSE"
  | "OTHER";

export type ProjectDocumentExtractionStatus =
  | "NOT_REQUESTED"
  | "PENDING"
  | "COMPLETED"
  | "UNSUPPORTED"
  | "FAILED";

export type ProjectInvitationStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED";

export type ProjectProposalStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type ProjectContractStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export type ProjectEscrowStatus =
  | "NOT_FUNDED"
  | "PARTIALLY_FUNDED"
  | "FUNDED"
  | "RELEASED"
  | "DISPUTED"
  | "CANCELLED";

export type ProjectMilestoneStatus =
  | "DRAFT"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "RELEASED"
  | "DISPUTED";

export type ProjectInvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";

export type ProjectPaymentStatus = "REQUESTED" | "APPROVED" | "RELEASED" | "FAILED";
export type ProjectDisputeType =
  | "MILESTONE"
  | "INVOICE"
  | "PAYMENT"
  | "CONTRACT"
  | "SAFETY"
  | "QUALITY"
  | "OTHER";
export type ProjectDisputeStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";
export type ProjectDisputeSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ProjectDisputeEventType =
  | "COMMENT"
  | "STATUS_CHANGE"
  | "EVIDENCE_ADDED"
  | "RESOLUTION";

export type ActorDocumentType =
  | "COMPANY_DOCUMENT"
  | "TAX_DOCUMENT"
  | "INSURANCE_DOCUMENT"
  | "PROJECT_AUTHORITY_DOCUMENT"
  | "IDENTITY_DOCUMENT"
  | "NACE_ACTIVITY_DOCUMENT"
  | "AUTHORIZATION_DOCUMENT"
  | "CERTIFICATE_DOCUMENT"
  | "LICENSE_DOCUMENT"
  | "TRAINING_DOCUMENT"
  | "MEDICAL_DOCUMENT"
  | "OTHER";

export type ActorCertificationType =
  | "CERTIFICATE"
  | "PERMIT"
  | "LICENSE"
  | "TRAINING_RECORD"
  | "INSURANCE"
  | "OTHER";

export type ComplianceDocumentStatus =
  | "PENDING"
  | "VALID"
  | "EXPIRED"
  | "REJECTED"
  | "REQUIRES_REVIEW";

export type MedicalFitnessCategory =
  | "VISION"
  | "CARDIOVASCULAR"
  | "WORK_AT_HEIGHT"
  | "PSYCHOLOGICAL_FITNESS"
  | "TRANSMISSIBLE_DISEASES"
  | "GENERAL_PHYSICAL_FITNESS"
  | "JOB_SPECIFIC_CLEARANCE";

export type MedicalFitnessDecision = "FIT" | "LIMITED" | "UNFIT" | "REQUIRES_REVIEW";

export type ComplianceAlertType =
  | "ONBOARDING_REQUIREMENT"
  | "DOCUMENT_EXPIRING"
  | "DOCUMENT_EXPIRED"
  | "CERTIFICATION_EXPIRING"
  | "CERTIFICATION_EXPIRED"
  | "MEDICAL_EXPIRING"
  | "MEDICAL_EXPIRED"
  | "CONTRACT_ELIGIBILITY_RISK";

export type ComplianceAlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type ComplianceAlertStatus = "PENDING" | "SENT" | "READ" | "RESOLVED";

export type UserTaskType =
  | "UPLOAD_CERTIFICATE"
  | "RENEW_MEDICAL_FITNESS"
  | "ACCEPT_CONTRACT"
  | "UPLOAD_INSURANCE"
  | "COMPLETE_PROFILE"
  | "REVIEW_PROPOSAL"
  | "APPROVE_MILESTONE"
  | "SUBMIT_INVOICE"
  | "CONFIRM_SITE_ATTENDANCE"
  | "UPLOAD_PROJECT_REPORT"
  | "REVIEW_COMPLIANCE";

export type UserTaskStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "EXPIRED";
export type UserTaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EligibilityStatus =
  | "ELIGIBLE"
  | "PARTIALLY_ELIGIBLE"
  | "NOT_ELIGIBLE"
  | "BLOCKED";
export type NotificationChannel =
  | "IN_APP"
  | "EMAIL"
  | "SMS"
  | "SMS_PLACEHOLDER"
  | "PUSH"
  | "SYSTEM";
export type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL";
export type NotificationStatus =
  | "PENDING"
  | "SENT"
  | "FAILED"
  | "READ"
  | "DISMISSED";
export type NotificationCategory =
  | "ACCOUNT"
  | "BILLING"
  | "VERIFICATION"
  | "PROJECTS"
  | "MESSAGING"
  | "WORKFORCE"
  | "PAYROLL"
  | "RELU"
  | "ADMIN";
export type ConversationType =
  | "PROJECT"
  | "CONTRACT"
  | "DISPUTE"
  | "DIRECT"
  | "WORKFORCE"
  | "PAYROLL"
  | "RELU"
  | "SUPPORT";
export type ConversationParticipantRole =
  | "OWNER"
  | "CONTRACTOR"
  | "WORKER"
  | "ADMIN"
  | "SUPERVISOR"
  | "MEMBER"
  | "OBSERVER";
export type MessageType = "TEXT" | "SYSTEM" | "FILE";
export type MessageStatus = "SENT" | "DELIVERED" | "READ" | "ARCHIVED" | "DELETED";
export type PublicModerationStatus = "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
export type WorkerEmploymentType = "EMPLOYEE" | "FREELANCER" | "SUBCONTRACTED" | "TEMPORARY";
export type WorkerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type WorkerDocumentType =
  | "IDENTITY"
  | "CERTIFICATE"
  | "MEDICAL"
  | "PERMIT"
  | "TRAINING"
  | "INSURANCE"
  | "OTHER";
export type ProjectWorkerAssignmentStatus =
  | "PROPOSED"
  | "APPROVED"
  | "ACTIVE"
  | "REMOVED"
  | "BLOCKED";
export type WorkerAttendanceStatus = "CHECKED_IN" | "CHECKED_OUT" | "MISSED" | "INVALID";
export type WorkerWorkLogStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type WorkerTimesheetStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "LOCKED";

export type TaxonomyOption = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
};

export type CountryOption = {
  id: string;
  code: string;
  name: string;
  currency: string;
  vatRate: number;
  regions: Array<{
    id: string;
    name: string;
    cities: Array<{
      id: string;
      name: string;
    }>;
  }>;
};

export type GeographySummary = {
  country: CountryOption | null;
  region: CountryOption["regions"][number] | null;
  city: CountryOption["regions"][number]["cities"][number] | null;
};

export type ProfileSummary = {
  id: string;
  userId: string;
  profileType: ProfileType;
  displayName: string;
  companyName: string | null;
  summary: string | null;
  availabilityStatus: ProfileAvailabilityStatus;
};

export type AIInterpretationTaxonomySuggestion = {
  id: string;
  code: string;
  title: string;
  reason: string;
  matchedKeywords: string[];
  score: number;
};

export type AIInterpretationDocumentSummary = {
  id: string;
  fileName: string;
  mimeType: string;
  storageKey: string;
  extractionStatus: string;
  hasExtractedText: boolean;
  extractedCharacterCount: number;
};

export type AIInterpretationPayload = {
  summary?: string;
  detectedEngagementModel?: AIInterpretationDetectedEngagementModel;
  suggestedJobRequests?: Array<{
    title: string;
    reason: string;
    matchedKeywords: string[];
  }>;
  suggestedConditions?: Array<{
    type: "SAFETY" | "PAYMENT" | "INSURANCE" | "TECHNICAL" | "LEGAL" | "CUSTOM";
    title: string;
    content: string;
    reason: string;
  }>;
  taxonomySuggestions?: {
    esco?: AIInterpretationTaxonomySuggestion[];
    nace?: AIInterpretationTaxonomySuggestion[];
    uniclass?: AIInterpretationTaxonomySuggestion[];
  };
  riskFlags?: string[];
  financeFlags?: string[];
  complianceFlags?: string[];
  sourceStats?: {
    documentIds?: string[];
    documentsWithExtractedText?: string[];
    totalCharacters?: number;
    sourceTextCharacters?: number;
    extractedDocumentCharacters?: number;
  };
  documents?: AIInterpretationDocumentSummary[];
  error?: string;
  sourceText?: string | null;
  documentIds?: string[];
};

export type ApplyAISuggestionsPayload = {
  applySummary?: boolean;
  applyEngagementModel?: boolean;
  jobRequestIndexes?: number[];
  conditionIndexes?: number[];
  taxonomy?: {
    escoIds?: string[];
    naceIds?: string[];
    uniclassIds?: string[];
  };
};

export type ProjectOwner = {
  id: string;
  email: string;
  role: string;
};

export type ProjectCounts = {
  jobRequests: number;
  conditions: number;
  documents: number;
  aiInterpretation?: number;
};

export type ProjectListItem = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  status: ProjectStatus;
  engagementModel: EngagementModel;
  visibility: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  responseDeadline: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  currencyCode: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  owner: ProjectOwner;
  geography: GeographySummary;
  primaryLanguage?: { id: string; code: string; name: string } | null;
  classifications?: {
    escoSkills: TaxonomyOption[];
    naceCodes: TaxonomyOption[];
    uniclassCodes: TaxonomyOption[];
  };
  counts: ProjectCounts;
  aggregates: {
    jobRequestStatusCounts: Record<string, number>;
  };
  aiInterpretation: {
    id: string;
    status: AIInterpretationStatus;
    updatedAt: string;
  } | null;
  escoSkills: TaxonomyOption[];
  naceCodes: TaxonomyOption[];
  uniclassCodes: TaxonomyOption[];
};

export type ProjectCondition = {
  id: string;
  projectId: string;
  jobRequestId: string | null;
  type: ConditionType;
  scope: string;
  title: string;
  clauseKey: string | null;
  content: string;
  isMandatory: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDocument = {
  id: string;
  projectId: string;
  jobRequestId: string | null;
  uploadedById: string | null;
  type: ProjectDocumentType | string;
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  isPublic: boolean;
  checksumSha256: string | null;
  extractionStatus: ProjectDocumentExtractionStatus | string;
  extractionError: string | null;
  extractedAt: string | null;
  createdAt: string;
  updatedAt: string;
  storage: {
    provider: string;
    bucket: string | null;
    key: string;
  };
};

export type ProjectJobRequest = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  scopeOfWork: string | null;
  status: JobRequestStatus;
  workerCount: number | null;
  unit: string | null;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  currencyCode: string | null;
  requiredExperienceYears: number | null;
  requiresCertification: boolean;
  startDate: string | null;
  endDate: string | null;
  responseDeadline: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  language: { id: string; code: string; name: string } | null;
  counts: {
    conditions: number;
    documents: number;
  };
  conditions: ProjectCondition[];
  documents: ProjectDocument[];
  escoSkills?: TaxonomyOption[];
  naceCodes?: TaxonomyOption[];
  uniclassCodes?: TaxonomyOption[];
};

export type ProjectAIInterpretation = {
  id: string;
  projectId: string;
  status: AIInterpretationStatus;
  sourceText: string | null;
  extractedJson: AIInterpretationPayload | string | null;
  documentIds: string[];
  confidenceScore: number | null;
  modelName: string | null;
  modelVersion: string | null;
  promptVersion: string | null;
  reviewedById: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMatchResult = {
  profileId: string;
  name: string;
  profileType: ProfileType;
  score: number;
  eligibility: EligibilityAssessment;
  reasons: string[];
  missingRequirements: string[];
  taxonomyOverlap: {
    esco: TaxonomyOption[];
    nace: TaxonomyOption[];
    uniclass: TaxonomyOption[];
  };
  documentCount: number;
};

export type ProjectShortlistEntry = {
  id: string;
  projectId: string;
  profileId: string;
  createdById: string;
  matchScore: number | null;
  notes: string | null;
  createdAt: string;
  createdBy: ProjectOwner;
  profile: ProfileSummary & {
    supportedEngagementModels: EngagementModel[];
    geography: GeographySummary;
    counts: {
      documents: number;
    };
    escoSkills: TaxonomyOption[];
    naceCodes: TaxonomyOption[];
    uniclassCodes: TaxonomyOption[];
  };
};

export type ProjectInvitation = {
  id: string;
  projectId: string;
  profileId: string;
  createdById: string;
  status: ProjectInvitationStatus;
  message: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  createdBy?: ProjectOwner;
  project: {
    id: string;
    name: string;
    slug: string;
    status: ProjectStatus;
    engagementModel: EngagementModel;
    location: string | null;
  };
  profile: ProfileSummary;
  eligibility: EligibilityAssessment | null;
};

export type ProjectProposal = {
  id: string;
  projectId: string;
  profileId: string;
  invitationId: string | null;
  submittedById: string;
  status: ProjectProposalStatus;
  title: string;
  message: string | null;
  priceCents: number | null;
  currencyCode: string | null;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  terms: string | null;
  createdAt: string;
  updatedAt: string;
  submittedBy: ProjectOwner;
  project: {
    id: string;
    name: string;
    slug: string;
    status: ProjectStatus;
    engagementModel: EngagementModel;
    location: string | null;
  };
  profile: ProfileSummary;
  invitation: {
    id: string;
    status: ProjectInvitationStatus;
    message: string | null;
    sentAt: string | null;
    respondedAt: string | null;
  } | null;
  eligibility: EligibilityAssessment | null;
};

export type ProjectEscrowAccount = {
  id: string;
  projectId: string;
  contractId: string;
  status: ProjectEscrowStatus;
  currencyCode: string | null;
  totalAmountCents: number;
  fundedAmountCents: number;
  releasedAmountCents: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMilestone = {
  id: string;
  projectId: string;
  contractId: string;
  title: string;
  description: string | null;
  amountCents: number;
  status: ProjectMilestoneStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInvoice = {
  id: string;
  projectId: string;
  contractId: string;
  milestoneId: string | null;
  profileId: string;
  issuedById: string;
  invoiceNumber: string;
  status: ProjectInvoiceStatus;
  currencyCode: string;
  amountCents: number;
  vatCents: number;
  totalCents: number;
  description: string | null;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: ProfileSummary | null;
  issuedBy: ProjectOwner | null;
  milestone: ProjectMilestone | null;
  payments: ProjectPayment[];
};

export type ProjectPayment = {
  id: string;
  projectId: string;
  contractId: string;
  invoiceId: string;
  escrowAccountId: string;
  profileId: string;
  amountCents: number;
  currencyCode: string;
  status: ProjectPaymentStatus;
  requestedAt: string;
  approvedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: ProfileSummary | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    status: ProjectInvoiceStatus;
    totalCents: number;
    currencyCode: string;
    milestoneId: string | null;
  } | null;
};

export type ProjectDisputeEvent = {
  id: string;
  disputeId: string;
  actorUserId: string;
  type: ProjectDisputeEventType;
  message: string;
  metadataJson: Record<string, unknown> | string | null;
  createdAt: string;
  actorUser: ProjectOwner | null;
};

export type ProjectDispute = {
  id: string;
  projectId: string;
  contractId: string;
  milestoneId: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  openedById: string;
  againstProfileId: string | null;
  type: ProjectDisputeType;
  status: ProjectDisputeStatus;
  severity: ProjectDisputeSeverity;
  title: string;
  description: string;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  openedBy: ProjectOwner | null;
  againstProfile: ProfileSummary | null;
  milestone: {
    id: string;
    title: string;
    status: ProjectMilestoneStatus;
  } | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    status: ProjectInvoiceStatus;
  } | null;
  payment: {
    id: string;
    status: ProjectPaymentStatus;
    amountCents: number;
    currencyCode: string;
  } | null;
  events: ProjectDisputeEvent[];
};

export type ContractFinancialSnapshot = {
  id: string;
  contractId: string;
  projectId: string;
  profileId: string;
  countryId: string | null;
  contractType: EngagementModel;
  currencyCode: string;
  grossAmountCents: number;
  vatAmountCents: number;
  netAmountCents: number;
  platformFeeCents: number;
  escrowRequiredAmountCents: number;
  workerGrossPayCents: number | null;
  workerNetPayCents: number | null;
  employerCostCents: number | null;
  calculationJson: Record<string, unknown> | string | null;
  createdAt: string;
  country: {
    id: string;
    code: string;
    name: string;
    currency: string;
    vatRate: number;
  } | null;
};

export type ProjectContract = {
  id: string;
  projectId: string;
  proposalId: string;
  profileId: string;
  createdById: string;
  status: ProjectContractStatus;
  contractType: EngagementModel;
  title: string;
  scopeSummary: string | null;
  commercialTerms: string | null;
  paymentTerms: string | null;
  safetyTerms: string | null;
  insuranceTerms: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: ProjectOwner;
  project: {
    id: string;
    name: string;
    slug: string;
    status: ProjectStatus;
    engagementModel: EngagementModel;
  };
  proposal: {
    id: string;
    status: ProjectProposalStatus;
    title: string;
    priceCents: number | null;
    currencyCode: string | null;
    message: string | null;
    terms: string | null;
    estimatedStartDate: string | null;
    estimatedEndDate: string | null;
  };
  profile: ProfileSummary;
  escrow: ProjectEscrowAccount | null;
  milestones: ProjectMilestone[];
  financialSnapshot: ContractFinancialSnapshot | null;
  invoices: ProjectInvoice[];
  payments: ProjectPayment[];
  disputes: ProjectDispute[];
};

export type ProfileProposalInbox = {
  profile: {
    id: string;
    profileType: ProfileType;
    displayName: string;
    companyName: string | null;
  };
  invitations: ProjectInvitation[];
  proposals: ProjectProposal[];
};

export type ProjectDetail = ProjectListItem & {
  description: string | null;
  scopeOfWork: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  conditions: ProjectCondition[];
  documents: ProjectDocument[];
  jobRequests: ProjectJobRequest[];
  aiInterpretation: ProjectAIInterpretation | null;
  aggregates: {
    jobRequestStatusCounts: Record<string, number>;
    mandatoryConditionCount: number;
    publicDocumentCount: number;
  };
};

export type ProfileDocument = {
  id: string;
  profileId: string;
  type: ProfileDocumentType;
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  extractionStatus: ProjectDocumentExtractionStatus | string;
  extractionError: string | null;
  extractedAt: string | null;
  createdAt: string;
  updatedAt: string;
  storage: {
    provider: string;
    bucket: string | null;
    key: string;
  };
};

export type ActorDocument = {
  id: string;
  profileId: string;
  userId: string;
  profileDocumentId: string | null;
  type: ActorDocumentType;
  title: string;
  issuer: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  status: ComplianceDocumentStatus;
  verifiedById: string | null;
  verifiedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  profileDocument: {
    id: string;
    title: string;
    fileName: string;
    mimeType: string;
  } | null;
};

export type ActorCertification = {
  id: string;
  profileId: string;
  userId: string;
  actorDocumentId: string | null;
  type: ActorCertificationType;
  title: string;
  issuer: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  status: ComplianceDocumentStatus;
  escoSkill: TaxonomyOption | null;
  verifiedById: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  actorDocument: ActorDocument | null;
};

export type MedicalFitnessCertificate = {
  id: string;
  profileId: string;
  userId: string;
  actorDocumentId: string | null;
  category: MedicalFitnessCategory;
  title: string;
  issuerName: string;
  issuedByProfile: {
    id: string;
    displayName: string;
    profileType: ProfileType;
  } | null;
  issuedAt: string | null;
  expiresAt: string | null;
  status: ComplianceDocumentStatus;
  fitnessDecision: MedicalFitnessDecision;
  jobSpecificClearance: string | null;
  verifiedById: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  actorDocument: ActorDocument | null;
};

export type ComplianceAlert = {
  id: string;
  key: string;
  userId: string;
  profileId: string | null;
  projectId: string | null;
  contractId: string | null;
  actorDocumentId: string | null;
  actorCertificationId: string | null;
  medicalFitnessCertificateId: string | null;
  type: ComplianceAlertType;
  severity: ComplianceAlertSeverity;
  message: string;
  dueDate: string | null;
  status: ComplianceAlertStatus;
  createdAt: string;
  sentAt: string | null;
  readAt: string | null;
  resolvedAt: string | null;
};

export type NotificationItem = {
  id: string;
  key: string;
  eventId: string | null;
  userId: string;
  profileId: string | null;
  actorId?: string | null;
  type: string;
  category?: NotificationCategory | null;
  channel: NotificationChannel;
  severity: NotificationSeverity;
  title: string;
  message: string;
  status: NotificationStatus;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  scheduledFor: string | null;
  sentAt: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  readAt: string | null;
  dismissedAt?: string | null;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type NotificationListResponse = {
  unreadCount: number;
  items: NotificationItem[];
};

export type NotificationPreference = {
  id: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessageRead = {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  status: MessageStatus;
  content: string;
  metadataJson: Record<string, unknown> | string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  moderationStatus?: PublicModerationStatus;
  moderatedAt?: string | null;
  moderationNotes?: string | null;
  isFlagged?: boolean;
  createdAt: string;
  updatedAt?: string;
  sender: ProjectOwner | null;
  reads: ConversationMessageRead[];
  attachments?: Array<{
    id: string;
    conversationId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    canPreview: boolean;
    status: PublicModerationStatus;
    moderatedAt?: string | null;
    moderationNotes?: string | null;
    createdAt: string;
  }>;
};

export type ConversationParticipant = {
  id: string;
  userId: string;
  role: ConversationParticipantRole;
  unreadCount?: number;
  lastReadAt?: string | null;
  lastSeenAt?: string | null;
  isMuted?: boolean;
  isArchived?: boolean;
  typingStartedAt?: string | null;
  joinedAt: string;
  user: ProjectOwner | null;
};

export type ConversationItem = {
  id: string;
  projectId: string | null;
  publicPostId?: string | null;
  contractId: string | null;
  disputeId: string | null;
  workforceAssignmentId?: string | null;
  payrollCycleId?: string | null;
  payrollSettlementId?: string | null;
  reluRecommendationId?: string | null;
  type: ConversationType;
  title?: string | null;
  createdAt: string;
  updatedAt?: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  project: {
    id: string;
    slug: string;
    name: string;
    status: ProjectStatus;
  } | null;
  publicPost?: {
    id: string;
    slug: string;
    title: string;
    moderationStatus: PublicModerationStatus;
  } | null;
  contract: {
    id: string;
    title: string;
    status: ProjectContractStatus;
  } | null;
  dispute: {
    id: string;
    title: string;
    status: ProjectDisputeStatus;
    severity: ProjectDisputeSeverity;
  } | null;
  participants: ConversationParticipant[];
  latestMessage: ConversationMessage | null;
  unreadCount: number;
};

export type AuditLogItem = {
  id: string;
  actorUserId: string;
  projectId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson: Record<string, unknown> | string | null;
  afterJson: Record<string, unknown> | string | null;
  metadataJson: Record<string, unknown> | string | null;
  createdAt: string;
  actorUser: {
    id: string;
    email: string;
    role: string;
  };
};

export type UserTask = {
  id: string;
  key: string;
  assignedToUserId: string;
  projectId: string | null;
  contractId: string | null;
  profileId: string | null;
  actorDocumentId: string | null;
  actorCertificationId: string | null;
  medicalFitnessCertificateId: string | null;
  type: UserTaskType;
  title: string;
  description: string | null;
  status: UserTaskStatus;
  priority: UserTaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  project: {
    id: string;
    name: string;
    slug: string;
  } | null;
  contract: {
    id: string;
    title: string;
    status: ProjectContractStatus;
  } | null;
};

export type ProfileDetail = {
  id: string;
  userId: string;
  profileType: ProfileType;
  displayName: string;
  companyName: string | null;
  description: string | null;
  summary: string | null;
  supportedEngagementModels: EngagementModel[];
  certificationsText: string | null;
  availabilityStatus: ProfileAvailabilityStatus;
  rating: number | null;
  geography: GeographySummary;
  languages: Array<{ id: string; code: string; name: string }>;
  escoSkills: TaxonomyOption[];
  naceCodes: TaxonomyOption[];
  uniclassCodes: TaxonomyOption[];
  contractorProfile: {
    tradeFocus: string | null;
    teamSize: number | null;
    serviceArea: string | null;
  } | null;
  professionalProfile: {
    headline: string | null;
    yearsExperience: number | null;
    portfolioFocus: string | null;
  } | null;
  documents: ProfileDocument[];
  counts: {
    documents: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type ProfileComplianceWorkspace = {
  profileId: string;
  actorType: {
    role: string;
    profileType: ProfileType;
  };
  onboarding: {
    readiness: "READY" | "MISSING_REQUIREMENTS" | "AT_RISK";
    requiredItems: Array<{
      key: string;
      label: string;
      description: string;
      kind: "document" | "certification" | "medical";
      satisfied: boolean;
      status: ComplianceDocumentStatus;
      currentRecordId: string | null;
    }>;
  };
  actorDocuments: ActorDocument[];
  certifications: ActorCertification[];
  medicalFitnessCertificates: MedicalFitnessCertificate[];
  alerts: ComplianceAlert[];
  tasks: UserTask[];
  activeContracts: Array<{
    id: string;
    status: ProjectContractStatus;
    project: {
      id: string;
      name: string;
    };
    counterparty: {
      userId: string;
    };
  }>;
};

export type EligibilityAssessment = {
  profileId: string;
  workerId?: string;
  projectId: string | null;
  jobRequestId: string | null;
  profileEligibility: EligibilityStatus;
  projectEligibility: EligibilityStatus;
  jobRequestEligibility: EligibilityStatus | null;
  workerEligibility: EligibilityStatus | null;
  blockingReasons: string[];
  warnings: string[];
  missingItems: string[];
};

export type WorkerDocument = {
  id: string;
  workerId: string;
  type: WorkerDocumentType;
  title: string;
  issuer: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  status: ComplianceDocumentStatus;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  storageProvider: string | null;
  storageKey: string | null;
  medicalCategory: MedicalFitnessCategory | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkerSkill = {
  id: string;
  workerId: string;
  escoSkillId: string | null;
  title: string;
  level: string | null;
  createdAt: string;
  escoSkill: TaxonomyOption | null;
};

export type ProfileWorker = {
  id: string;
  profileId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roleTitle: string;
  employmentType: WorkerEmploymentType;
  status: WorkerStatus;
  createdAt: string;
  updatedAt: string;
  documents: WorkerDocument[];
  skills: WorkerSkill[];
  counts: {
    documents: number;
    skills: number;
    assignments: number;
  };
  eligibility: EligibilityAssessment;
};

export type ProjectWorkerAssignment = {
  id: string;
  projectId: string;
  contractId: string | null;
  jobRequestId: string | null;
  profileId: string;
  workerId: string;
  status: ProjectWorkerAssignmentStatus;
  assignedById: string;
  approvedById: string | null;
  assignedAt: string;
  approvedAt: string | null;
  removedAt: string | null;
  project: {
    id: string;
    name: string;
    slug: string;
    createdById: string;
  } | null;
  contract: {
    id: string;
    title: string;
    status: ProjectContractStatus;
  } | null;
  jobRequest: {
    id: string;
    title: string;
    status: JobRequestStatus;
    requiresCertification: boolean;
  } | null;
  profile: ProfileSummary | null;
  worker: {
    id: string;
    profileId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    roleTitle: string;
    employmentType: WorkerEmploymentType;
    status: WorkerStatus;
    documents: Array<{
      id: string;
      type: WorkerDocumentType;
      title: string;
      status: ComplianceDocumentStatus;
      expiresAt: string | null;
      medicalCategory: MedicalFitnessCategory | null;
    }>;
    skills: Array<{
      id: string;
      title: string;
      level: string | null;
      escoSkill: TaxonomyOption | null;
    }>;
  } | null;
  assignedBy: ProjectOwner | null;
  approvedBy: ProjectOwner | null;
  eligibility: EligibilityAssessment;
  canApprove: boolean;
};

export type WorkerAttendance = {
  id: string;
  projectId: string;
  contractId: string | null;
  jobRequestId: string | null;
  workerId: string;
  assignmentId: string | null;
  checkInAt: string;
  checkOutAt: string | null;
  status: WorkerAttendanceStatus;
  locationLat: number | null;
  locationLng: number | null;
  createdAt: string;
  worker: {
    id: string;
    profileId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    roleTitle: string;
    status: WorkerStatus;
  } | null;
  assignment: {
    id: string;
    status: ProjectWorkerAssignmentStatus;
  } | null;
  jobRequest: {
    id: string;
    title: string;
  } | null;
};

export type WorkerWorkLog = {
  id: string;
  projectId: string;
  jobRequestId: string | null;
  workerId: string;
  assignmentId: string | null;
  date: string;
  hoursWorked: number;
  description: string;
  status: WorkerWorkLogStatus;
  createdAt: string;
  updatedAt: string;
  worker: {
    id: string;
    profileId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    roleTitle: string;
    status: WorkerStatus;
    profile: ProfileSummary | null;
  } | null;
  assignment: {
    id: string;
    status: ProjectWorkerAssignmentStatus;
  } | null;
  jobRequest: {
    id: string;
    title: string;
    status: JobRequestStatus;
  } | null;
};

export type WorkerPayrollCalculation = {
  id: string;
  timesheetId: string;
  projectId: string;
  contractId: string | null;
  profileId: string;
  workerId: string;
  currencyCode: string;
  hourlyRateCents: number;
  regularPayCents: number;
  overtimePayCents: number;
  grossPayCents: number;
  estimatedTaxCents: number;
  estimatedSocialContributionCents: number;
  netPayCents: number;
  employerCostCents: number;
  calculationJson: Record<string, unknown> | string | null;
  createdAt: string;
};

export type WorkerTimesheet = {
  id: string;
  projectId: string;
  contractId: string | null;
  profileId: string;
  workerId: string;
  periodStart: string;
  periodEnd: string;
  status: WorkerTimesheetStatus;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  approvedById: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  worker: {
    id: string;
    profileId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    roleTitle: string;
    status: WorkerStatus;
  } | null;
  profile: ProfileSummary | null;
  contract: {
    id: string;
    title: string;
    status: ProjectContractStatus;
    contractType: EngagementModel;
  } | null;
  approvedBy: ProjectOwner | null;
  payrollCalculation: WorkerPayrollCalculation | null;
  complianceWarnings?: string[];
};

export type ProjectComplianceOverview = {
  projectId: string;
  summary: {
    activeContracts: number;
    missingRequirementsCount: number;
    expiringCount: number;
    expiredCount: number;
    openAlerts: number;
    openTasks: number;
  };
  actors: Array<{
    contractId: string;
    contractStatus: ProjectContractStatus;
    profileId: string;
    displayName: string;
    companyName: string | null;
    profileType: ProfileType;
    onboarding: ProfileComplianceWorkspace["onboarding"];
    alerts: ComplianceAlert[];
    tasks: UserTask[];
  }>;
  alerts: ComplianceAlert[];
  tasks: UserTask[];
};

export type UpsertProfilePayload = {
  profileType: ProfileType;
  displayName: string;
  companyName?: string | null;
  summary?: string | null;
  description?: string | null;
  countryId?: string | null;
  regionId?: string | null;
  cityId?: string | null;
  supportedEngagementModels: EngagementModel[];
  certificationsText?: string | null;
  availabilityStatus: ProfileAvailabilityStatus;
  rating?: number | null;
  languageIds?: string[];
  escoSkillIds?: string[];
  naceIds?: string[];
  uniclassIds?: string[];
  contractorProfile?: {
    tradeFocus?: string;
    teamSize?: number;
    serviceArea?: string;
  };
  professionalProfile?: {
    headline?: string;
    yearsExperience?: number;
    portfolioFocus?: string;
  };
};

export type CreateProjectPayload = {
  name: string;
  summary?: string;
  location?: string;
  engagementModel: EngagementModel;
  status: ProjectStatus;
  escoSkillIds?: string[];
  naceIds?: string[];
  uniclassIds?: string[];
  jobRequests: Array<{
    title: string;
    status: JobRequestStatus;
    workerCount?: number;
    notes?: string;
  }>;
  conditions: Array<{
    type: ConditionType;
    title: string;
    content: string;
    isMandatory: boolean;
  }>;
  aiInterpretation: {
    status: AIInterpretationStatus;
    sourceText: string;
  };
};
