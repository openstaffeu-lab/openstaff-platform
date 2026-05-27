import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActorCertificationType,
  ActorDocumentType,
  ComplianceDocumentStatus,
  MedicalFitnessCategory,
  MedicalFitnessDecision,
  NotificationSeverity,
  ProfileType,
  ProjectConditionType,
  UserTaskPriority,
  UserTaskStatus,
  UserTaskType,
  WorkerDocumentType,
  WorkerStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessPolicy } from '../projects/project-access.policy';
import { ComplianceService } from './compliance.service';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

type EligibilityStatus =
  | 'ELIGIBLE'
  | 'PARTIALLY_ELIGIBLE'
  | 'NOT_ELIGIBLE'
  | 'BLOCKED';

type RequirementDefinition =
  | {
      key: string;
      label: string;
      kind: 'document';
      documentType: ActorDocumentType;
      blockingIfMissing?: boolean;
    }
  | {
      key: string;
      label: string;
      kind: 'certification';
      certificationTypes: ActorCertificationType[];
      blockingIfMissing?: boolean;
    }
  | {
      key: string;
      label: string;
      kind: 'medical';
      categories?: MedicalFitnessCategory[];
      blockingIfMissing?: boolean;
    };

type EligibilityAssessment = {
  profileEligibility: EligibilityStatus;
  projectEligibility: EligibilityStatus;
  jobRequestEligibility?: EligibilityStatus | null;
  workerEligibility?: EligibilityStatus | null;
  blockingReasons: string[];
  warnings: string[];
  missingItems: string[];
};

@Injectable()
export class ComplianceEligibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly complianceService: ComplianceService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async getCurrentProfileEligibility(user: AuthenticatedUser) {
    const profile = await this.getProfileForUser(user);
    await this.complianceService.refreshProfileCompliance(profile.id);
    const refreshedProfile = await this.loadProfile(profile.id);
    const assessment = this.evaluateAssessment(refreshedProfile, null, null);
    await this.syncEligibilityTask(refreshedProfile, assessment, {
      scope: 'profile',
    });
    return this.toEligibilityResponse(
      refreshedProfile.id,
      null,
      null,
      assessment,
    );
  }

  async getProjectEligibility(projectId: string, user: AuthenticatedUser) {
    const profile = await this.getProfileForUser(user);
    const project = await this.loadProject(projectId);
    this.accessPolicy.assertCanReadProject(user, project.createdById);

    await this.complianceService.refreshProfileCompliance(profile.id);
    const refreshedProfile = await this.loadProfile(profile.id);
    const assessment = this.evaluateAssessment(refreshedProfile, project, null);
    await this.syncEligibilityTask(refreshedProfile, assessment, {
      scope: 'project',
      projectId: project.id,
    });
    return this.toEligibilityResponse(
      refreshedProfile.id,
      project.id,
      null,
      assessment,
    );
  }

  async getJobRequestEligibility(
    projectId: string,
    jobRequestId: string,
    user: AuthenticatedUser,
  ) {
    const profile = await this.getProfileForUser(user);
    const project = await this.loadProject(projectId);
    this.accessPolicy.assertCanReadProject(user, project.createdById);

    const jobRequest = project.jobRequests.find(
      (item: any) => item.id === jobRequestId,
    );

    if (!jobRequest) {
      throw new NotFoundException('Project job request not found');
    }

    await this.complianceService.refreshProfileCompliance(profile.id);
    const refreshedProfile = await this.loadProfile(profile.id);
    const assessment = this.evaluateAssessment(
      refreshedProfile,
      project,
      jobRequest,
    );
    await this.syncEligibilityTask(refreshedProfile, assessment, {
      scope: 'job-request',
      projectId: project.id,
      jobRequestId: jobRequest.id,
    });
    return this.toEligibilityResponse(
      refreshedProfile.id,
      project.id,
      jobRequest.id,
      assessment,
    );
  }

  async evaluateProfileForProjectByIds(
    projectId: string,
    profileId: string,
    options?: {
      jobRequestId?: string;
      syncTasks?: boolean;
    },
  ) {
    const [project, profile] = await Promise.all([
      this.loadProject(projectId),
      this.loadProfile(profileId),
    ]);
    const jobRequest = options?.jobRequestId
      ? project.jobRequests.find(
          (item: any) => item.id === options.jobRequestId,
        )
      : null;

    if (options?.jobRequestId && !jobRequest) {
      throw new NotFoundException('Project job request not found');
    }

    const assessment = this.evaluateAssessment(profile, project, jobRequest);

    if (options?.syncTasks) {
      await this.syncEligibilityTask(profile, assessment, {
        scope: jobRequest ? 'job-request' : 'project',
        projectId: project.id,
        jobRequestId: jobRequest?.id,
      });
    }

    return this.toEligibilityResponse(
      profile.id,
      project.id,
      jobRequest?.id ?? null,
      assessment,
    );
  }

  async evaluateWorkerForProfileByIds(profileId: string, workerId: string) {
    const [profile, worker] = await Promise.all([
      this.loadProfile(profileId),
      this.loadWorker(workerId, profileId),
    ]);
    const assessment = this.evaluateWorkerAssessment(
      profile,
      worker,
      null,
      null,
    );
    return this.toWorkerEligibilityResponse(
      profile.id,
      worker.id,
      null,
      null,
      assessment,
    );
  }

  async evaluateWorkerForProjectByIds(
    projectId: string,
    profileId: string,
    workerId: string,
    options?: {
      jobRequestId?: string;
    },
  ) {
    const [project, profile, worker] = await Promise.all([
      this.loadProject(projectId),
      this.loadProfile(profileId),
      this.loadWorker(workerId, profileId),
    ]);
    const jobRequest = options?.jobRequestId
      ? project.jobRequests.find(
          (item: any) => item.id === options.jobRequestId,
        )
      : null;

    if (options?.jobRequestId && !jobRequest) {
      throw new NotFoundException('Project job request not found');
    }

    const assessment = this.evaluateWorkerAssessment(
      profile,
      worker,
      project,
      jobRequest,
    );
    return this.toWorkerEligibilityResponse(
      profile.id,
      worker.id,
      project.id,
      jobRequest?.id ?? null,
      assessment,
    );
  }

  async assertCanSubmitProposal(
    projectId: string,
    profileId: string,
    actorUserId?: string,
  ) {
    const eligibility = await this.evaluateProfileForProjectByIds(
      projectId,
      profileId,
      {
        syncTasks: true,
      },
    );

    await this.assertNotIneligible(
      eligibility,
      'Proposal submission is blocked until the compliance issues are resolved.',
      {
        actorUserId,
        projectId,
        profileId,
        action: 'PROPOSAL_SUBMIT_BLOCKED',
      },
    );
  }

  async assertCanAcceptInvitation(
    projectId: string,
    profileId: string,
    actorUserId?: string,
  ) {
    const eligibility = await this.evaluateProfileForProjectByIds(
      projectId,
      profileId,
      {
        syncTasks: true,
      },
    );

    await this.assertNotIneligible(
      eligibility,
      'Invitation acceptance is blocked until the compliance issues are resolved.',
      {
        actorUserId,
        projectId,
        profileId,
        action: 'INVITATION_ACCEPT_BLOCKED',
      },
    );
  }

  async assertCanCreateContract(
    projectId: string,
    profileId: string,
    actorUserId?: string,
  ) {
    const eligibility = await this.evaluateProfileForProjectByIds(
      projectId,
      profileId,
      {
        syncTasks: true,
      },
    );

    await this.assertNotIneligible(
      eligibility,
      'Contract creation is blocked because the selected actor is not eligible for this project.',
      {
        actorUserId,
        projectId,
        profileId,
        action: 'CONTRACT_CREATE_BLOCKED',
      },
    );
  }

  async assertCanCreateInvoice(
    projectId: string,
    profileId: string,
    actorUserId?: string,
  ) {
    const eligibility = await this.evaluateProfileForProjectByIds(
      projectId,
      profileId,
      {
        syncTasks: true,
      },
    );

    await this.assertNotBlocked(
      eligibility,
      'Invoice creation is blocked while the actor remains compliance-blocked.',
      {
        actorUserId,
        projectId,
        profileId,
        action: 'INVOICE_CREATE_BLOCKED',
      },
    );
  }

  async assertCanRequestPayment(
    projectId: string,
    profileId: string,
    actorUserId?: string,
  ) {
    const eligibility = await this.evaluateProfileForProjectByIds(
      projectId,
      profileId,
      {
        syncTasks: true,
      },
    );

    await this.assertNotBlocked(
      eligibility,
      'Payment requests are blocked while the actor remains compliance-blocked.',
      {
        actorUserId,
        projectId,
        profileId,
        action: 'PAYMENT_REQUEST_BLOCKED',
      },
    );
  }

  private evaluateAssessment(
    profile: any,
    project: any | null,
    jobRequest: any | null,
  ) {
    const blockingReasons: string[] = [];
    const warnings: string[] = [];
    const missingItems: string[] = [];
    const notEligibleReasons: string[] = [];

    const baseRequirements = this.getRequirementsForProfileType(
      profile.profileType,
    );
    for (const requirement of baseRequirements) {
      this.evaluateRequirement(
        requirement,
        profile,
        blockingReasons,
        notEligibleReasons,
        warnings,
        missingItems,
      );
    }

    const expiredDocuments = profile.actorDocuments.filter((item: any) =>
      this.isExpiredStatus(item.status, item.expiresAt),
    );
    const expiredCertifications = profile.actorCertifications.filter(
      (item: any) => this.isExpiredStatus(item.status, item.expiresAt),
    );
    const expiredMedical = profile.medicalFitnessCertificates.filter(
      (item: any) =>
        this.isExpiredStatus(item.status, item.expiresAt) ||
        item.fitnessDecision === MedicalFitnessDecision.UNFIT,
    );

    if (expiredMedical.length > 0) {
      blockingReasons.push(
        'Medical fitness is expired or invalid for work participation.',
      );
    }

    if (
      this.isCompanyProfile(profile.profileType) &&
      (expiredDocuments.length > 0 || expiredCertifications.length > 0)
    ) {
      notEligibleReasons.push(
        'Company compliance evidence contains expired documents or certifications.',
      );
    }

    if (this.hasPendingCompliance(profile)) {
      warnings.push(
        'Some compliance records are still pending review or verification.',
      );
    }

    const profileEligibility = this.resolveStatus(
      blockingReasons,
      notEligibleReasons,
      warnings,
    );

    const projectBlockingReasons = [...blockingReasons];
    const projectWarnings = [...warnings];
    const projectMissingItems = [...missingItems];
    const projectNotEligibleReasons = [...notEligibleReasons];

    if (project) {
      const supportedEngagementModels = this.parseStringArray(
        profile.supportedEngagementModels,
      );
      if (
        supportedEngagementModels.length > 0 &&
        !supportedEngagementModels.includes(project.engagementModel)
      ) {
        projectNotEligibleReasons.push(
          `The profile does not support ${project.engagementModel} engagement.`,
        );
        projectMissingItems.push(
          `Support ${project.engagementModel} engagement model`,
        );
      }

      if (
        profile.countryId &&
        project.countryId &&
        profile.countryId !== project.countryId
      ) {
        projectWarnings.push(
          'Profile geography differs from the project country and may need manual approval.',
        );
      }

      if (project.primaryLanguageId) {
        const languageIds = new Set(
          profile.languages.map((item: any) => item.languageId),
        );
        if (!languageIds.has(project.primaryLanguageId)) {
          projectWarnings.push(
            'Primary project language is not listed on the profile.',
          );
          projectMissingItems.push(
            'Add the project language to the actor profile',
          );
        }
      }

      const projectConditionTypes = new Set(
        project.conditions.map(
          (condition: any) => condition.type as ProjectConditionType,
        ),
      );
      if (
        projectConditionTypes.has(ProjectConditionType.INSURANCE) &&
        !this.hasValidInsurance(profile)
      ) {
        projectNotEligibleReasons.push(
          'Insurance terms are present on the project and the actor has no valid insurance evidence.',
        );
        projectMissingItems.push('Upload or renew valid insurance evidence');
      }

      if (
        projectConditionTypes.has(ProjectConditionType.SAFETY) &&
        !this.hasSafetyEvidence(profile)
      ) {
        projectWarnings.push(
          'Safety evidence is not obvious from the actor compliance record.',
        );
      }

      if (
        projectConditionTypes.has(ProjectConditionType.COMPLIANCE) &&
        !this.hasValidCertification(profile)
      ) {
        projectNotEligibleReasons.push(
          'Project compliance clauses require at least one valid certification or permit.',
        );
        projectMissingItems.push('Upload a valid certification or permit');
      }

      for (const candidateJobRequest of project.jobRequests) {
        const jobEligibility = this.evaluateJobRequestRules(
          profile,
          project,
          candidateJobRequest,
          false,
        );
        if (jobEligibility.blockingReasons.length > 0) {
          projectBlockingReasons.push(...jobEligibility.blockingReasons);
        }
        if (jobEligibility.notEligibleReasons.length > 0) {
          projectNotEligibleReasons.push(...jobEligibility.notEligibleReasons);
        }
        if (jobEligibility.warnings.length > 0) {
          projectWarnings.push(...jobEligibility.warnings);
        }
        if (jobEligibility.missingItems.length > 0) {
          projectMissingItems.push(...jobEligibility.missingItems);
        }
      }
    }

    const projectEligibility = project
      ? this.resolveStatus(
          projectBlockingReasons,
          projectNotEligibleReasons,
          projectWarnings,
        )
      : profileEligibility;

    let jobRequestEligibility: EligibilityStatus | undefined;
    if (project && jobRequest) {
      const jobRules = this.evaluateJobRequestRules(
        profile,
        project,
        jobRequest,
        true,
      );
      const combinedBlocking = [
        ...blockingReasons,
        ...jobRules.blockingReasons,
      ];
      const combinedNotEligible = [
        ...notEligibleReasons,
        ...jobRules.notEligibleReasons,
      ];
      const combinedWarnings = [...warnings, ...jobRules.warnings];
      const combinedMissing = [...missingItems, ...jobRules.missingItems];

      return {
        profileEligibility,
        projectEligibility,
        jobRequestEligibility: this.resolveStatus(
          combinedBlocking,
          combinedNotEligible,
          combinedWarnings,
        ),
        blockingReasons: this.uniqueStrings(combinedBlocking),
        warnings: this.uniqueStrings(combinedWarnings),
        missingItems: this.uniqueStrings(combinedMissing),
      };
    }

    return {
      profileEligibility,
      projectEligibility,
      jobRequestEligibility,
      blockingReasons: this.uniqueStrings(
        project ? projectBlockingReasons : blockingReasons,
      ),
      warnings: this.uniqueStrings(project ? projectWarnings : warnings),
      missingItems: this.uniqueStrings(
        project ? projectMissingItems : missingItems,
      ),
    };
  }

  private evaluateWorkerAssessment(
    profile: any,
    worker: any,
    project: any | null,
    jobRequest: any | null,
  ) {
    const baseAssessment = this.evaluateAssessment(
      profile,
      project,
      jobRequest,
    );
    const blockingReasons = [...baseAssessment.blockingReasons];
    const warnings = [...baseAssessment.warnings];
    const missingItems = [...baseAssessment.missingItems];
    const workerNotEligibleReasons: string[] = [];

    if (worker.status === WorkerStatus.SUSPENDED) {
      blockingReasons.push(
        `Worker ${worker.firstName} ${worker.lastName} is suspended.`,
      );
    } else if (worker.status === WorkerStatus.INACTIVE) {
      workerNotEligibleReasons.push(
        `Worker ${worker.firstName} ${worker.lastName} is inactive and cannot be assigned.`,
      );
    }

    const validIdentity = worker.documents.some(
      (item: any) =>
        item.type === WorkerDocumentType.IDENTITY && this.isValidRecord(item),
    );
    if (!validIdentity) {
      blockingReasons.push(
        `Worker ${worker.firstName} ${worker.lastName} is missing a valid identity document.`,
      );
      missingItems.push(
        `Worker identity document: ${worker.firstName} ${worker.lastName}`,
      );
    }

    const validMedicalDocuments = worker.documents.filter(
      (item: any) =>
        item.type === WorkerDocumentType.MEDICAL && this.isValidRecord(item),
    );
    if (validMedicalDocuments.length === 0) {
      workerNotEligibleReasons.push(
        `Worker ${worker.firstName} ${worker.lastName} needs a valid medical record before assignment.`,
      );
      missingItems.push(
        `Worker medical record: ${worker.firstName} ${worker.lastName}`,
      );
    }

    if (project && jobRequest?.requiresCertification) {
      const hasCertification = worker.documents.some(
        (item: any) =>
          (item.type === WorkerDocumentType.CERTIFICATE ||
            item.type === WorkerDocumentType.PERMIT ||
            item.type === WorkerDocumentType.TRAINING) &&
          this.isValidRecord(item),
      );

      if (!hasCertification) {
        workerNotEligibleReasons.push(
          `Worker ${worker.firstName} ${worker.lastName} lacks a valid certification for ${jobRequest.title}.`,
        );
        missingItems.push(`Worker certification for ${jobRequest.title}`);
      }
    }

    if (project && jobRequest) {
      const requiredMedicalCategories = this.inferMedicalCategories(
        project,
        jobRequest,
      );
      if (requiredMedicalCategories.length > 0) {
        const missingCategories = requiredMedicalCategories.filter(
          (category) =>
            !worker.documents.some(
              (item: any) =>
                item.type === WorkerDocumentType.MEDICAL &&
                item.medicalCategory === category &&
                this.isValidRecord(item),
            ),
        );

        if (missingCategories.length > 0) {
          blockingReasons.push(
            `Worker ${worker.firstName} ${worker.lastName} is missing valid medical clearance for ${missingCategories.join(', ')}.`,
          );
          missingItems.push(
            `Worker medical clearance: ${worker.firstName} ${worker.lastName} (${missingCategories.join(', ')})`,
          );
        }
      }
    }

    const workerEligibility = this.resolveStatus(
      blockingReasons,
      workerNotEligibleReasons,
      warnings,
    );

    return {
      profileEligibility: baseAssessment.profileEligibility,
      projectEligibility:
        project &&
        (workerEligibility === 'BLOCKED' ||
          workerEligibility === 'NOT_ELIGIBLE')
          ? workerEligibility
          : baseAssessment.projectEligibility,
      jobRequestEligibility:
        jobRequest &&
        (workerEligibility === 'BLOCKED' ||
          workerEligibility === 'NOT_ELIGIBLE')
          ? workerEligibility
          : (baseAssessment.jobRequestEligibility ?? null),
      workerEligibility,
      blockingReasons: this.uniqueStrings(blockingReasons),
      warnings: this.uniqueStrings(warnings),
      missingItems: this.uniqueStrings(missingItems),
    };
  }

  private evaluateRequirement(
    requirement: RequirementDefinition,
    profile: any,
    blockingReasons: string[],
    notEligibleReasons: string[],
    warnings: string[],
    missingItems: string[],
  ) {
    if (requirement.kind === 'document') {
      const matchingDocuments = profile.actorDocuments.filter(
        (item: any) => item.type === requirement.documentType,
      );
      const validDocument = matchingDocuments.find((item: any) =>
        this.isValidRecord(item),
      );

      if (validDocument) {
        return;
      }

      const hasExpiredDocument = matchingDocuments.some((item: any) =>
        this.isExpiredStatus(item.status, item.expiresAt),
      );
      const hasPendingDocument = matchingDocuments.some((item: any) =>
        this.isPendingOrReview(item.status),
      );

      missingItems.push(requirement.label);
      if (requirement.blockingIfMissing) {
        blockingReasons.push(`${requirement.label} is missing or expired.`);
        return;
      }

      if (hasExpiredDocument) {
        notEligibleReasons.push(
          `${requirement.label} is expired and must be renewed.`,
        );
        return;
      }

      if (hasPendingDocument) {
        warnings.push(`${requirement.label} is still pending validation.`);
        return;
      }

      notEligibleReasons.push(
        `${requirement.label} is required before this actor can operate.`,
      );
      return;
    }

    if (requirement.kind === 'certification') {
      const matchingCertifications = profile.actorCertifications.filter(
        (item: any) => requirement.certificationTypes.includes(item.type),
      );
      const validCertification = matchingCertifications.find((item: any) =>
        this.isValidRecord(item),
      );

      if (validCertification) {
        return;
      }

      const hasPendingCertification = matchingCertifications.some((item: any) =>
        this.isPendingOrReview(item.status),
      );

      missingItems.push(requirement.label);
      if (hasPendingCertification) {
        warnings.push(`${requirement.label} is still pending review.`);
      } else {
        notEligibleReasons.push(
          `${requirement.label} is required and currently missing.`,
        );
      }
      return;
    }

    const matchingMedical = profile.medicalFitnessCertificates.filter(
      (item: any) =>
        requirement.categories?.length
          ? requirement.categories.includes(item.category)
          : true,
    );
    const validMedical = matchingMedical.find((item: any) =>
      this.isValidMedicalRecord(item),
    );

    if (validMedical) {
      return;
    }

    const hasExpiredMedical = matchingMedical.some(
      (item: any) =>
        this.isExpiredStatus(item.status, item.expiresAt) ||
        item.fitnessDecision === MedicalFitnessDecision.UNFIT,
    );
    const hasPendingMedical = matchingMedical.some((item: any) =>
      this.isPendingOrReview(item.status),
    );

    missingItems.push(requirement.label);
    if (hasExpiredMedical) {
      blockingReasons.push(
        `${requirement.label} is expired or medically invalid.`,
      );
      return;
    }

    if (hasPendingMedical) {
      warnings.push(`${requirement.label} is still under review.`);
      return;
    }

    notEligibleReasons.push(
      `${requirement.label} is required before assignment.`,
    );
  }

  private evaluateJobRequestRules(
    profile: any,
    project: any,
    jobRequest: any,
    includeWarnings: boolean,
  ) {
    const blockingReasons: string[] = [];
    const notEligibleReasons: string[] = [];
    const warnings: string[] = [];
    const missingItems: string[] = [];

    if (
      jobRequest.requiresCertification &&
      !this.hasValidCertification(profile)
    ) {
      notEligibleReasons.push(
        `Job request "${jobRequest.title}" requires at least one valid certification.`,
      );
      missingItems.push(`Valid certification for ${jobRequest.title}`);
    }

    const requiredMedicalCategories = this.inferMedicalCategories(
      project,
      jobRequest,
    );
    if (requiredMedicalCategories.length > 0) {
      const missingCategories = requiredMedicalCategories.filter(
        (category) =>
          !profile.medicalFitnessCertificates.some(
            (item: any) =>
              item.category === category && this.isValidMedicalRecord(item),
          ),
      );

      if (missingCategories.length > 0) {
        blockingReasons.push(
          `Job request "${jobRequest.title}" requires valid medical fitness for ${missingCategories.join(', ')}.`,
        );
        missingItems.push(
          `Medical clearance for ${jobRequest.title}: ${missingCategories.join(', ')}`,
        );
      }
    }

    if (includeWarnings && jobRequest.languageId) {
      const languageIds = new Set(
        profile.languages.map((item: any) => item.languageId),
      );
      if (!languageIds.has(jobRequest.languageId)) {
        warnings.push(
          `Job request "${jobRequest.title}" expects a language not listed on the profile.`,
        );
      }
    }

    return { blockingReasons, notEligibleReasons, warnings, missingItems };
  }

  private inferMedicalCategories(project: any, jobRequest: any) {
    const text = [
      project.name,
      project.summary,
      project.description,
      project.scopeOfWork,
      jobRequest.title,
      jobRequest.description,
      jobRequest.scopeOfWork,
      jobRequest.notes,
      ...project.conditions.map(
        (condition: any) => `${condition.title} ${condition.content}`,
      ),
      ...project.conditions
        .filter((condition: any) => condition.jobRequestId === jobRequest.id)
        .map((condition: any) => `${condition.title} ${condition.content}`),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const map: Array<{ category: MedicalFitnessCategory; keywords: string[] }> =
      [
        {
          category: MedicalFitnessCategory.WORK_AT_HEIGHT,
          keywords: [
            'work at height',
            'height',
            'scaffold',
            'rope access',
            'elevated',
          ],
        },
        {
          category: MedicalFitnessCategory.VISION,
          keywords: ['vision', 'eyesight', 'visual inspection'],
        },
        {
          category: MedicalFitnessCategory.CARDIOVASCULAR,
          keywords: ['cardiovascular', 'heart', 'cardio'],
        },
        {
          category: MedicalFitnessCategory.PSYCHOLOGICAL_FITNESS,
          keywords: ['psychological', 'mental fitness'],
        },
        {
          category: MedicalFitnessCategory.TRANSMISSIBLE_DISEASES,
          keywords: ['transmissible', 'infectious', 'disease screening'],
        },
        {
          category: MedicalFitnessCategory.GENERAL_PHYSICAL_FITNESS,
          keywords: [
            'physical fitness',
            'manual handling',
            'physically fit',
            'fit for duty',
          ],
        },
        {
          category: MedicalFitnessCategory.JOB_SPECIFIC_CLEARANCE,
          keywords: [
            'job-specific clearance',
            'site medical',
            'medical clearance',
          ],
        },
      ];

    return map
      .filter((item) => item.keywords.some((keyword) => text.includes(keyword)))
      .map((item) => item.category);
  }

  private resolveStatus(
    blockingReasons: string[],
    notEligibleReasons: string[],
    warnings: string[],
  ): EligibilityStatus {
    if (blockingReasons.length > 0) {
      return 'BLOCKED';
    }

    if (notEligibleReasons.length > 0) {
      return 'NOT_ELIGIBLE';
    }

    if (warnings.length > 0) {
      return 'PARTIALLY_ELIGIBLE';
    }

    return 'ELIGIBLE';
  }

  private async syncEligibilityTask(
    profile: any,
    assessment: EligibilityAssessment,
    scope: {
      scope: 'profile' | 'project' | 'job-request';
      projectId?: string;
      jobRequestId?: string;
    },
  ) {
    const taskKey = `eligibility:${scope.scope}:${profile.id}:${scope.projectId ?? 'profile'}:${scope.jobRequestId ?? 'all'}`;
    const targetStatus =
      assessment.jobRequestEligibility ??
      assessment.projectEligibility ??
      assessment.profileEligibility;

    if (targetStatus === 'NOT_ELIGIBLE' || targetStatus === 'BLOCKED') {
      await this.prisma.userTask.upsert({
        where: { key: taskKey },
        update: {
          status: UserTaskStatus.OPEN,
          title:
            targetStatus === 'BLOCKED'
              ? 'Resolve blocked compliance issue'
              : 'Resolve compliance eligibility issue',
          description: this.buildTaskDescription(assessment),
          priority:
            targetStatus === 'BLOCKED'
              ? UserTaskPriority.CRITICAL
              : UserTaskPriority.HIGH,
          projectId: scope.projectId ?? null,
          profileId: profile.id,
          completedAt: null,
        },
        create: {
          key: taskKey,
          assignedToUserId: profile.userId,
          profileId: profile.id,
          projectId: scope.projectId ?? null,
          type: UserTaskType.REVIEW_COMPLIANCE,
          title:
            targetStatus === 'BLOCKED'
              ? 'Resolve blocked compliance issue'
              : 'Resolve compliance eligibility issue',
          description: this.buildTaskDescription(assessment),
          status: UserTaskStatus.OPEN,
          priority:
            targetStatus === 'BLOCKED'
              ? UserTaskPriority.CRITICAL
              : UserTaskPriority.HIGH,
        },
      });
      return;
    }

    const existingTask = await this.prisma.userTask.findUnique({
      where: { key: taskKey },
    });

    if (existingTask && existingTask.status !== UserTaskStatus.COMPLETED) {
      await this.prisma.userTask.update({
        where: { id: existingTask.id },
        data: {
          status: UserTaskStatus.COMPLETED,
          completedAt: existingTask.completedAt ?? new Date(),
        },
      });
    }
  }

  private buildTaskDescription(assessment: EligibilityAssessment) {
    const details = [...assessment.blockingReasons, ...assessment.missingItems]
      .filter(Boolean)
      .slice(0, 5);

    return details.length > 0
      ? details.join(' | ')
      : 'Resolve missing certificates, medical fitness, or compliance documents.';
  }

  private async assertNotIneligible(
    assessment: EligibilityAssessment,
    prefix: string,
    context?: {
      actorUserId?: string;
      projectId?: string;
      profileId?: string;
      action?: string;
    },
  ) {
    const status =
      assessment.jobRequestEligibility ?? assessment.projectEligibility;
    if (status === 'NOT_ELIGIBLE' || status === 'BLOCKED') {
      const message = this.buildForbiddenMessage(prefix, assessment);
      await this.recordBlockedDecision(context, assessment, message);
      throw new ForbiddenException(message);
    }
  }

  private async assertNotBlocked(
    assessment: EligibilityAssessment,
    prefix: string,
    context?: {
      actorUserId?: string;
      projectId?: string;
      profileId?: string;
      action?: string;
    },
  ) {
    const status =
      assessment.jobRequestEligibility ?? assessment.projectEligibility;
    if (status === 'BLOCKED') {
      const message = this.buildForbiddenMessage(prefix, assessment);
      await this.recordBlockedDecision(context, assessment, message);
      throw new ForbiddenException(message);
    }
  }

  private buildForbiddenMessage(
    prefix: string,
    assessment: EligibilityAssessment,
  ) {
    const reasons = [
      ...assessment.blockingReasons,
      ...assessment.missingItems,
    ].filter(Boolean);
    return reasons.length > 0 ? `${prefix} ${reasons.join(' | ')}` : prefix;
  }

  private async recordBlockedDecision(
    context:
      | {
          actorUserId?: string;
          projectId?: string;
          profileId?: string;
          action?: string;
        }
      | undefined,
    assessment: EligibilityAssessment,
    message: string,
  ) {
    if (!context?.actorUserId) {
      return;
    }

    await this.auditService.log({
      actorUserId: context.actorUserId,
      projectId: context.projectId ?? null,
      entityType: 'Eligibility',
      entityId: context.profileId ?? 'unknown-profile',
      action: context.action ?? 'ACTION_BLOCKED',
      before: null,
      after: {
        message,
        assessment,
      },
      metadata: {
        profileId: context.profileId,
        projectId: context.projectId,
      },
    });

    if (context.profileId) {
      await this.notificationService.createInAppNotification({
        key: `blocked:${context.action ?? 'action'}:${context.profileId}:${context.projectId ?? 'none'}`,
        userId: context.actorUserId,
        profileId: context.profileId,
        type: 'ELIGIBILITY_BLOCKED',
        severity: NotificationSeverity.CRITICAL,
        title: 'Action blocked by compliance',
        message,
        relatedEntityType: 'Project',
        relatedEntityId: context.projectId ?? null,
        scheduledFor: new Date(),
      });
    }
  }

  private toEligibilityResponse(
    profileId: string,
    projectId: string | null,
    jobRequestId: string | null,
    assessment: EligibilityAssessment,
  ) {
    return {
      profileId,
      projectId,
      jobRequestId,
      profileEligibility: assessment.profileEligibility,
      projectEligibility: assessment.projectEligibility,
      jobRequestEligibility: assessment.jobRequestEligibility ?? null,
      workerEligibility: assessment.workerEligibility ?? null,
      blockingReasons: this.uniqueStrings(assessment.blockingReasons),
      warnings: this.uniqueStrings(assessment.warnings),
      missingItems: this.uniqueStrings(assessment.missingItems),
    };
  }

  private toWorkerEligibilityResponse(
    profileId: string,
    workerId: string,
    projectId: string | null,
    jobRequestId: string | null,
    assessment: EligibilityAssessment,
  ) {
    return {
      workerId,
      ...this.toEligibilityResponse(
        profileId,
        projectId,
        jobRequestId,
        assessment,
      ),
    };
  }

  private hasPendingCompliance(profile: any) {
    return (
      profile.actorDocuments.some((item: any) =>
        this.isPendingOrReview(item.status),
      ) ||
      profile.actorCertifications.some((item: any) =>
        this.isPendingOrReview(item.status),
      ) ||
      profile.medicalFitnessCertificates.some((item: any) =>
        this.isPendingOrReview(item.status),
      )
    );
  }

  private hasValidInsurance(profile: any) {
    return (
      profile.actorDocuments.some(
        (item: any) =>
          item.type === ActorDocumentType.INSURANCE_DOCUMENT &&
          this.isValidRecord(item),
      ) ||
      profile.actorCertifications.some(
        (item: any) =>
          item.type === ActorCertificationType.INSURANCE &&
          this.isValidRecord(item),
      )
    );
  }

  private hasSafetyEvidence(profile: any) {
    const text = [
      profile.summary,
      profile.description,
      profile.certificationsText,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (
      text.includes('safety') ||
      text.includes('hse') ||
      profile.actorCertifications.some((item: any) => this.isValidRecord(item))
    );
  }

  private hasValidCertification(profile: any) {
    return profile.actorCertifications.some((item: any) =>
      this.isValidRecord(item),
    );
  }

  private isCompanyProfile(profileType: ProfileType) {
    return (
      profileType === ProfileType.GENERAL_CONTRACTOR ||
      profileType === ProfileType.CONTRACTOR ||
      profileType === ProfileType.SUBCONTRACTOR
    );
  }

  private isValidRecord(item: {
    status: ComplianceDocumentStatus;
    expiresAt?: Date | null;
  }) {
    return (
      item.status === ComplianceDocumentStatus.VALID &&
      (!item.expiresAt || item.expiresAt >= new Date())
    );
  }

  private isValidMedicalRecord(item: {
    status: ComplianceDocumentStatus;
    expiresAt?: Date | null;
    fitnessDecision: MedicalFitnessDecision;
  }) {
    return (
      this.isValidRecord(item) &&
      (item.fitnessDecision === MedicalFitnessDecision.FIT ||
        item.fitnessDecision === MedicalFitnessDecision.LIMITED)
    );
  }

  private isExpiredStatus(
    status: ComplianceDocumentStatus,
    expiresAt?: Date | null,
  ) {
    return (
      status === ComplianceDocumentStatus.EXPIRED ||
      (!!expiresAt && expiresAt < new Date())
    );
  }

  private isPendingOrReview(status: ComplianceDocumentStatus) {
    return (
      status === ComplianceDocumentStatus.PENDING ||
      status === ComplianceDocumentStatus.REQUIRES_REVIEW
    );
  }

  private parseStringArray(value: string | null) {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }

  private uniqueStrings(items: string[]) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  private async getProfileForUser(user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  private async loadProfile(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: this.profileInclude,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  private async loadProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: this.projectInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async loadWorker(workerId: string, profileId: string) {
    const worker = await this.prisma.profileWorker.findFirst({
      where: {
        id: workerId,
        profileId,
      },
      include: {
        documents: true,
        skills: {
          include: {
            escoSkill: true,
          },
        },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    return worker;
  }

  private getRequirementsForProfileType(
    profileType: ProfileType,
  ): RequirementDefinition[] {
    if (profileType === ProfileType.GENERAL_CONTRACTOR) {
      return [
        {
          key: 'company-document',
          label: 'Company registration document',
          kind: 'document',
          documentType: ActorDocumentType.COMPANY_DOCUMENT,
        },
        {
          key: 'tax-document',
          label: 'VAT or tax document',
          kind: 'document',
          documentType: ActorDocumentType.TAX_DOCUMENT,
        },
        {
          key: 'insurance-document',
          label: 'Insurance document',
          kind: 'document',
          documentType: ActorDocumentType.INSURANCE_DOCUMENT,
        },
        {
          key: 'project-authority',
          label: 'Project authority document',
          kind: 'document',
          documentType: ActorDocumentType.PROJECT_AUTHORITY_DOCUMENT,
        },
      ];
    }

    if (
      profileType === ProfileType.CONTRACTOR ||
      profileType === ProfileType.SUBCONTRACTOR
    ) {
      return [
        {
          key: 'company-document',
          label: 'Company registration document',
          kind: 'document',
          documentType: ActorDocumentType.COMPANY_DOCUMENT,
        },
        {
          key: 'nace-document',
          label: 'NACE activity document',
          kind: 'document',
          documentType: ActorDocumentType.NACE_ACTIVITY_DOCUMENT,
        },
        {
          key: 'insurance-document',
          label: 'Insurance document',
          kind: 'document',
          documentType: ActorDocumentType.INSURANCE_DOCUMENT,
        },
        {
          key: 'trade-certification',
          label: 'Trade certification or permit',
          kind: 'certification',
          certificationTypes: [
            ActorCertificationType.CERTIFICATE,
            ActorCertificationType.PERMIT,
            ActorCertificationType.LICENSE,
            ActorCertificationType.TRAINING_RECORD,
          ],
        },
      ];
    }

    if (
      profileType === ProfileType.PROFESSIONAL ||
      profileType === ProfileType.SUPERVISOR ||
      profileType === ProfileType.SPECIALIST
    ) {
      return [
        {
          key: 'identity-document',
          label: 'Identity document',
          kind: 'document',
          documentType: ActorDocumentType.IDENTITY_DOCUMENT,
          blockingIfMissing: true,
        },
        {
          key: 'professional-certificate',
          label: 'Certificate or license',
          kind: 'certification',
          certificationTypes: [
            ActorCertificationType.CERTIFICATE,
            ActorCertificationType.LICENSE,
          ],
        },
        {
          key: 'medical-fitness',
          label: 'Medical fitness',
          kind: 'medical',
        },
      ];
    }

    if (profileType === ProfileType.CLINIC_DOCTOR) {
      return [
        {
          key: 'authorization-document',
          label: 'Authorization document',
          kind: 'document',
          documentType: ActorDocumentType.AUTHORIZATION_DOCUMENT,
        },
        {
          key: 'medical-license',
          label: 'Medical license',
          kind: 'certification',
          certificationTypes: [ActorCertificationType.LICENSE],
        },
      ];
    }

    return [
      {
        key: 'authorization-document',
        label: 'Authorization document',
        kind: 'document',
        documentType: ActorDocumentType.AUTHORIZATION_DOCUMENT,
      },
      {
        key: 'training-license',
        label: 'Training record or license',
        kind: 'certification',
        certificationTypes: [
          ActorCertificationType.TRAINING_RECORD,
          ActorCertificationType.LICENSE,
        ],
      },
    ];
  }

  private readonly profileInclude = {
    user: true,
    languages: true,
    actorDocuments: true,
    actorCertifications: true,
    medicalFitnessCertificates: true,
  } as const;

  private readonly projectInclude = {
    conditions: true,
    jobRequests: true,
  } as const;
}
