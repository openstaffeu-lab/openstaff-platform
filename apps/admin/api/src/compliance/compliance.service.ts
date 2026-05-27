import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActorCertificationType,
  ActorDocumentType,
  ComplianceAlertSeverity,
  ComplianceAlertStatus,
  ComplianceAlertType,
  ComplianceDocumentStatus,
  MedicalFitnessCategory,
  MedicalFitnessDecision,
  ProfileType,
  ProjectContractStatus,
  UserTaskPriority,
  UserTaskStatus,
  UserTaskType,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActorCertificationDto } from './dto/create-actor-certification.dto';
import { CreateActorDocumentDto } from './dto/create-actor-document.dto';
import { CreateMedicalFitnessCertificateDto } from './dto/create-medical-fitness-certificate.dto';
import { UpdateActorCertificationDto } from './dto/update-actor-certification.dto';
import { UpdateActorDocumentDto } from './dto/update-actor-document.dto';
import { UpdateMedicalFitnessCertificateDto } from './dto/update-medical-fitness-certificate.dto';
import { UpdateUserTaskStatusDto } from './dto/update-user-task-status.dto';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

type RequirementDefinition =
  | {
      key: string;
      label: string;
      description: string;
      kind: 'document';
      documentType: ActorDocumentType;
    }
  | {
      key: string;
      label: string;
      description: string;
      kind: 'certification';
      certificationTypes: ActorCertificationType[];
    }
  | {
      key: string;
      label: string;
      description: string;
      kind: 'medical';
      categories?: MedicalFitnessCategory[];
    };

const activeContractStatuses: ProjectContractStatus[] = [
  ProjectContractStatus.DRAFT,
  ProjectContractStatus.SENT,
  ProjectContractStatus.ACCEPTED,
  ProjectContractStatus.ACTIVE,
];

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getCurrentProfileCompliance(user: AuthenticatedUser) {
    const profile = await this.getCurrentProfileOrThrow(user);
    await this.refreshProfileCompliance(profile.id);
    return this.buildProfileComplianceResponse(profile.id, user);
  }

  async recomputeCurrentProfileCompliance(user: AuthenticatedUser) {
    const profile = await this.getCurrentProfileOrThrow(user);
    await this.refreshProfileCompliance(profile.id);
    return this.buildProfileComplianceResponse(profile.id, user);
  }

  async listCurrentUserTasks(user: AuthenticatedUser) {
    const profile = await this.getCurrentProfileOrThrow(user);
    await this.refreshProfileCompliance(profile.id);
    const tasks = await this.prisma.userTask.findMany({
      where: {
        assignedToUserId: user.sub,
      },
      include: this.taskInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return tasks.map((task) => this.toTaskResponse(task));
  }

  async listCurrentUserAlerts(user: AuthenticatedUser) {
    const profile = await this.getCurrentProfileOrThrow(user);
    await this.refreshProfileCompliance(profile.id);
    const alerts = await this.prisma.complianceAlert.findMany({
      where: {
        userId: user.sub,
      },
      include: this.alertInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return alerts.map((alert) => this.toAlertResponse(alert));
  }

  async updateCurrentUserTask(
    taskId: string,
    body: UpdateUserTaskStatusDto,
    user: AuthenticatedUser,
  ) {
    const task = await this.prisma.userTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (user.role !== 'ADMIN' && task.assignedToUserId !== user.sub) {
      throw new ForbiddenException('You do not have access to this task');
    }

    const updatedTask = await this.prisma.userTask.update({
      where: { id: taskId },
      data: {
        status: body.status,
        completedAt:
          body.status === UserTaskStatus.COMPLETED
            ? (this.toDate(body.completedAt) ?? new Date())
            : body.status === UserTaskStatus.OPEN ||
                body.status === UserTaskStatus.IN_PROGRESS
              ? null
              : undefined,
      },
      include: this.taskInclude,
    });

    return this.toTaskResponse(updatedTask);
  }

  async createActorDocument(
    profileId: string,
    body: CreateActorDocumentDto,
    user: AuthenticatedUser,
  ) {
    const profile = await this.getManagedProfile(profileId, user);
    await this.assertProfileDocumentOwnership(
      body.profileDocumentId,
      profile.id,
    );

    const document = await this.prisma.actorDocument.create({
      data: {
        profileId: profile.id,
        userId: profile.userId,
        profileDocumentId: body.profileDocumentId ?? null,
        type: body.type,
        title: body.title.trim(),
        issuer: body.issuer?.trim() ?? null,
        issuedAt: this.toDate(body.issuedAt) ?? null,
        expiresAt: this.toDate(body.expiresAt) ?? null,
        status: body.status ?? ComplianceDocumentStatus.PENDING,
        notes: body.notes?.trim() ?? null,
      },
      include: this.actorDocumentInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      entityType: 'ActorDocument',
      entityId: document.id,
      action: 'CREATE',
      before: null,
      after: this.toActorDocumentResponse(document),
      metadata: {
        profileId: profile.id,
      },
    });

    await this.refreshProfileCompliance(profile.id);
    return this.toActorDocumentResponse(document);
  }

  async updateActorDocument(
    profileId: string,
    actorDocumentId: string,
    body: UpdateActorDocumentDto,
    user: AuthenticatedUser,
  ) {
    const profile = await this.getManagedProfile(profileId, user);
    const existing = await this.prisma.actorDocument.findFirst({
      where: {
        id: actorDocumentId,
        profileId: profile.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Actor document not found');
    }

    await this.assertProfileDocumentOwnership(
      body.profileDocumentId,
      profile.id,
    );

    const document = await this.prisma.actorDocument.update({
      where: { id: existing.id },
      data: {
        profileDocumentId: body.profileDocumentId ?? undefined,
        type: body.type ?? undefined,
        title: body.title?.trim(),
        issuer:
          body.issuer !== undefined ? (body.issuer?.trim() ?? null) : undefined,
        issuedAt:
          body.issuedAt !== undefined
            ? (this.toDate(body.issuedAt) ?? null)
            : undefined,
        expiresAt:
          body.expiresAt !== undefined
            ? (this.toDate(body.expiresAt) ?? null)
            : undefined,
        status: body.status ?? undefined,
        notes:
          body.notes !== undefined ? (body.notes?.trim() ?? null) : undefined,
      },
      include: this.actorDocumentInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      entityType: 'ActorDocument',
      entityId: document.id,
      action: 'UPDATE',
      before: existing,
      after: this.toActorDocumentResponse(document),
      metadata: {
        profileId: profile.id,
      },
    });

    await this.refreshProfileCompliance(profile.id);
    return this.toActorDocumentResponse(document);
  }

  async createCertification(
    profileId: string,
    body: CreateActorCertificationDto,
    user: AuthenticatedUser,
  ) {
    const profile = await this.getManagedProfile(profileId, user);
    await this.assertActorDocumentOwnership(body.actorDocumentId, profile.id);

    const certification = await this.prisma.actorCertification.create({
      data: {
        profileId: profile.id,
        userId: profile.userId,
        actorDocumentId: body.actorDocumentId ?? null,
        type: body.type,
        title: body.title.trim(),
        issuer: body.issuer?.trim() ?? null,
        issuedAt: this.toDate(body.issuedAt) ?? null,
        expiresAt: this.toDate(body.expiresAt) ?? null,
        status: body.status ?? ComplianceDocumentStatus.PENDING,
        escoSkillId: body.escoSkillId ?? null,
      },
      include: this.actorCertificationInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      entityType: 'ActorCertification',
      entityId: certification.id,
      action: 'CREATE',
      before: null,
      after: this.toActorCertificationResponse(certification),
      metadata: {
        profileId: profile.id,
      },
    });

    await this.refreshProfileCompliance(profile.id);
    return this.toActorCertificationResponse(certification);
  }

  async updateCertification(
    profileId: string,
    certificationId: string,
    body: UpdateActorCertificationDto,
    user: AuthenticatedUser,
  ) {
    const profile = await this.getManagedProfile(profileId, user);
    const existing = await this.prisma.actorCertification.findFirst({
      where: {
        id: certificationId,
        profileId: profile.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Certification not found');
    }

    await this.assertActorDocumentOwnership(body.actorDocumentId, profile.id);

    const certification = await this.prisma.actorCertification.update({
      where: { id: existing.id },
      data: {
        actorDocumentId: body.actorDocumentId ?? undefined,
        type: body.type ?? undefined,
        title: body.title?.trim(),
        issuer:
          body.issuer !== undefined ? (body.issuer?.trim() ?? null) : undefined,
        issuedAt:
          body.issuedAt !== undefined
            ? (this.toDate(body.issuedAt) ?? null)
            : undefined,
        expiresAt:
          body.expiresAt !== undefined
            ? (this.toDate(body.expiresAt) ?? null)
            : undefined,
        status: body.status ?? undefined,
        escoSkillId:
          body.escoSkillId !== undefined
            ? (body.escoSkillId ?? null)
            : undefined,
      },
      include: this.actorCertificationInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      entityType: 'ActorCertification',
      entityId: certification.id,
      action: 'UPDATE',
      before: existing,
      after: this.toActorCertificationResponse(certification),
      metadata: {
        profileId: profile.id,
      },
    });

    await this.refreshProfileCompliance(profile.id);
    return this.toActorCertificationResponse(certification);
  }

  async createMedicalFitnessCertificate(
    profileId: string,
    body: CreateMedicalFitnessCertificateDto,
    user: AuthenticatedUser,
  ) {
    const profile = await this.getManagedProfile(profileId, user);
    await this.assertActorDocumentOwnership(body.actorDocumentId, profile.id);
    await this.assertIssuedByProfile(body.issuedByProfileId);

    const certificate = await this.prisma.medicalFitnessCertificate.create({
      data: {
        profileId: profile.id,
        userId: profile.userId,
        actorDocumentId: body.actorDocumentId ?? null,
        category: body.category,
        title: body.title.trim(),
        issuerName: body.issuerName.trim(),
        issuedByProfileId: body.issuedByProfileId ?? null,
        issuedAt: this.toDate(body.issuedAt) ?? null,
        expiresAt: this.toDate(body.expiresAt) ?? null,
        status: body.status ?? ComplianceDocumentStatus.PENDING,
        fitnessDecision:
          body.fitnessDecision ?? MedicalFitnessDecision.REQUIRES_REVIEW,
        jobSpecificClearance: body.jobSpecificClearance?.trim() ?? null,
      },
      include: this.medicalFitnessInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      entityType: 'MedicalFitnessCertificate',
      entityId: certificate.id,
      action: 'CREATE',
      before: null,
      after: this.toMedicalFitnessResponse(certificate),
      metadata: {
        profileId: profile.id,
      },
    });

    await this.refreshProfileCompliance(profile.id);
    return this.toMedicalFitnessResponse(certificate);
  }

  async updateMedicalFitnessCertificate(
    profileId: string,
    medicalFitnessCertificateId: string,
    body: UpdateMedicalFitnessCertificateDto,
    user: AuthenticatedUser,
  ) {
    const profile = await this.getManagedProfile(profileId, user);
    const existing = await this.prisma.medicalFitnessCertificate.findFirst({
      where: {
        id: medicalFitnessCertificateId,
        profileId: profile.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Medical fitness certificate not found');
    }

    await this.assertActorDocumentOwnership(body.actorDocumentId, profile.id);
    await this.assertIssuedByProfile(body.issuedByProfileId);

    const certificate = await this.prisma.medicalFitnessCertificate.update({
      where: { id: existing.id },
      data: {
        actorDocumentId: body.actorDocumentId ?? undefined,
        category: body.category ?? undefined,
        title: body.title?.trim(),
        issuerName: body.issuerName?.trim(),
        issuedByProfileId:
          body.issuedByProfileId !== undefined
            ? (body.issuedByProfileId ?? null)
            : undefined,
        issuedAt:
          body.issuedAt !== undefined
            ? (this.toDate(body.issuedAt) ?? null)
            : undefined,
        expiresAt:
          body.expiresAt !== undefined
            ? (this.toDate(body.expiresAt) ?? null)
            : undefined,
        status: body.status ?? undefined,
        fitnessDecision: body.fitnessDecision ?? undefined,
        jobSpecificClearance:
          body.jobSpecificClearance !== undefined
            ? (body.jobSpecificClearance?.trim() ?? null)
            : undefined,
      },
      include: this.medicalFitnessInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      entityType: 'MedicalFitnessCertificate',
      entityId: certificate.id,
      action: 'UPDATE',
      before: existing,
      after: this.toMedicalFitnessResponse(certificate),
      metadata: {
        profileId: profile.id,
      },
    });

    await this.refreshProfileCompliance(profile.id);
    return this.toMedicalFitnessResponse(certificate);
  }

  async getProjectComplianceOverview(
    projectId: string,
    user: AuthenticatedUser,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (user.role !== 'ADMIN' && project.createdById !== user.sub) {
      throw new ForbiddenException(
        'You do not have access to this project compliance workspace',
      );
    }

    const contracts = await this.prisma.projectContract.findMany({
      where: {
        projectId,
      },
      include: {
        profile: true,
      },
    });

    for (const contract of contracts) {
      await this.refreshProfileCompliance(contract.profileId);
    }

    const [alerts, tasks, fullContracts] = await Promise.all([
      this.prisma.complianceAlert.findMany({
        where: { projectId, status: { not: ComplianceAlertStatus.RESOLVED } },
        include: this.alertInclude,
        orderBy: [
          { severity: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.userTask.findMany({
        where: {
          projectId,
          status: { not: UserTaskStatus.COMPLETED },
        },
        include: this.taskInclude,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.projectContract.findMany({
        where: { projectId },
        include: {
          profile: true,
          project: {
            select: {
              id: true,
              name: true,
              createdById: true,
            },
          },
        },
      }),
    ]);

    const actorItems = await Promise.all(
      fullContracts.map(async (contract) => {
        const profileCompliance = await this.buildProfileComplianceResponse(
          contract.profileId,
          {
            sub: contract.profile.userId,
            role: 'CONTRACTOR',
          },
        );

        const actorAlerts = alerts
          .filter((alert) => alert.profileId === contract.profileId)
          .map((alert) => this.toAlertResponse(alert));
        const actorTasks = tasks
          .filter((task) => task.profileId === contract.profileId)
          .map((task) => this.toTaskResponse(task));

        return {
          contractId: contract.id,
          contractStatus: contract.status,
          profileId: contract.profileId,
          displayName: contract.profile.displayName,
          companyName: contract.profile.companyName,
          profileType: contract.profile.profileType,
          onboarding: profileCompliance.onboarding,
          alerts: actorAlerts,
          tasks: actorTasks,
        };
      }),
    );

    const expiredAlertTypes = new Set<ComplianceAlertType>([
      ComplianceAlertType.DOCUMENT_EXPIRED,
      ComplianceAlertType.CERTIFICATION_EXPIRED,
      ComplianceAlertType.MEDICAL_EXPIRED,
    ]);
    const expiringAlertTypes = new Set<ComplianceAlertType>([
      ComplianceAlertType.DOCUMENT_EXPIRING,
      ComplianceAlertType.CERTIFICATION_EXPIRING,
      ComplianceAlertType.MEDICAL_EXPIRING,
    ]);
    const expiredCount = alerts.filter((alert) =>
      expiredAlertTypes.has(alert.type),
    ).length;
    const expiringCount = alerts.filter((alert) =>
      expiringAlertTypes.has(alert.type),
    ).length;

    return {
      projectId,
      summary: {
        activeContracts: fullContracts.length,
        missingRequirementsCount: actorItems.reduce(
          (total, item) =>
            total +
            item.onboarding.requiredItems.filter((req: any) => !req.satisfied)
              .length,
          0,
        ),
        expiringCount,
        expiredCount,
        openAlerts: alerts.length,
        openTasks: tasks.length,
      },
      actors: actorItems,
      alerts: alerts.map((alert) => this.toAlertResponse(alert)),
      tasks: tasks.map((task) => this.toTaskResponse(task)),
    };
  }

  private async buildProfileComplianceResponse(
    profileId: string,
    user: AuthenticatedUser,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: this.profileComplianceInclude,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (user.role !== 'ADMIN' && profile.userId !== user.sub) {
      throw new ForbiddenException(
        'You do not have access to this profile compliance workspace',
      );
    }

    const requirements = this.evaluateOnboardingRequirements(profile);
    const alerts = await this.prisma.complianceAlert.findMany({
      where: {
        userId: profile.userId,
        OR: [{ profileId: profile.id }, { contractId: { not: null } }],
        status: { not: ComplianceAlertStatus.RESOLVED },
      },
      include: this.alertInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
    const tasks = await this.prisma.userTask.findMany({
      where: {
        assignedToUserId: profile.userId,
        OR: [{ profileId: profile.id }, { contractId: { not: null } }],
        status: { not: UserTaskStatus.COMPLETED },
      },
      include: this.taskInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      profileId: profile.id,
      actorType: {
        role: profile.user.role,
        profileType: profile.profileType,
      },
      onboarding: {
        readiness: requirements.every((item) => item.satisfied)
          ? 'READY'
          : requirements.some(
                (item) => item.status === ComplianceDocumentStatus.EXPIRED,
              )
            ? 'AT_RISK'
            : 'MISSING_REQUIREMENTS',
        requiredItems: requirements,
      },
      actorDocuments: profile.actorDocuments.map((item) =>
        this.toActorDocumentResponse(item),
      ),
      certifications: profile.actorCertifications.map((item) =>
        this.toActorCertificationResponse(item),
      ),
      medicalFitnessCertificates: profile.medicalFitnessCertificates.map(
        (item) => this.toMedicalFitnessResponse(item),
      ),
      alerts: alerts.map((item) => this.toAlertResponse(item)),
      tasks: tasks.map((item) => this.toTaskResponse(item)),
      activeContracts: profile.contracts.map((contract) => ({
        id: contract.id,
        status: contract.status,
        project: {
          id: contract.project.id,
          name: contract.project.name,
        },
        counterparty: {
          userId: contract.project.createdById,
        },
      })),
    };
  }

  async refreshProfileCompliance(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: this.profileComplianceInclude,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const now = new Date();

    await this.prisma.actorDocument.updateMany({
      where: {
        profileId,
        expiresAt: { lt: now },
        status: {
          in: [
            ComplianceDocumentStatus.PENDING,
            ComplianceDocumentStatus.VALID,
            ComplianceDocumentStatus.REQUIRES_REVIEW,
          ],
        },
      },
      data: {
        status: ComplianceDocumentStatus.EXPIRED,
      },
    });
    await this.prisma.actorCertification.updateMany({
      where: {
        profileId,
        expiresAt: { lt: now },
        status: {
          in: [
            ComplianceDocumentStatus.PENDING,
            ComplianceDocumentStatus.VALID,
            ComplianceDocumentStatus.REQUIRES_REVIEW,
          ],
        },
      },
      data: {
        status: ComplianceDocumentStatus.EXPIRED,
      },
    });
    await this.prisma.medicalFitnessCertificate.updateMany({
      where: {
        profileId,
        expiresAt: { lt: now },
        status: {
          in: [
            ComplianceDocumentStatus.PENDING,
            ComplianceDocumentStatus.VALID,
            ComplianceDocumentStatus.REQUIRES_REVIEW,
          ],
        },
      },
      data: {
        status: ComplianceDocumentStatus.EXPIRED,
      },
    });

    const refreshedProfile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: this.profileComplianceInclude,
    });

    if (!refreshedProfile) {
      throw new NotFoundException('Profile not found after compliance refresh');
    }

    const activeAlertKeys = new Set<string>();
    const activeTaskKeys = new Set<string>();
    const impactedUsers = new Set<string>([refreshedProfile.userId]);

    const requirements = this.evaluateOnboardingRequirements(refreshedProfile);

    for (const requirement of requirements) {
      if (requirement.satisfied) {
        continue;
      }

      const dueDate = this.addDays(now, 7);
      const key = `onboarding:${refreshedProfile.id}:${requirement.key}`;
      activeAlertKeys.add(key);
      await this.upsertAlert({
        key,
        userId: refreshedProfile.userId,
        profileId: refreshedProfile.id,
        type: ComplianceAlertType.ONBOARDING_REQUIREMENT,
        severity:
          requirement.status === ComplianceDocumentStatus.EXPIRED
            ? ComplianceAlertSeverity.CRITICAL
            : ComplianceAlertSeverity.WARNING,
        message: `${requirement.label} is still required before this actor can operate fully on the platform.`,
        dueDate,
      });

      const taskType = this.taskTypeForRequirement(requirement);
      const taskKey = `onboarding-task:${refreshedProfile.id}:${requirement.key}`;
      activeTaskKeys.add(taskKey);
      await this.upsertTask({
        key: taskKey,
        assignedToUserId: refreshedProfile.userId,
        profileId: refreshedProfile.id,
        type: taskType,
        title: requirement.label,
        description: requirement.description,
        priority: UserTaskPriority.HIGH,
        dueDate,
      });
    }

    for (const document of refreshedProfile.actorDocuments) {
      await this.registerExpirySignalsForRecord({
        kind: 'document',
        profile: refreshedProfile,
        now,
        activeAlertKeys,
        activeTaskKeys,
        title: document.title,
        expiresAt: document.expiresAt,
        status: document.status,
        ownerMessagePrefix:
          document.type === ActorDocumentType.INSURANCE_DOCUMENT
            ? 'Insurance document'
            : 'Document',
        ownerTaskType:
          document.type === ActorDocumentType.INSURANCE_DOCUMENT
            ? UserTaskType.UPLOAD_INSURANCE
            : UserTaskType.COMPLETE_PROFILE,
        actorDocumentId: document.id,
      });
    }

    for (const certification of refreshedProfile.actorCertifications) {
      await this.registerExpirySignalsForRecord({
        kind: 'certification',
        profile: refreshedProfile,
        now,
        activeAlertKeys,
        activeTaskKeys,
        title: certification.title,
        expiresAt: certification.expiresAt,
        status: certification.status,
        ownerMessagePrefix: 'Certification',
        ownerTaskType: UserTaskType.UPLOAD_CERTIFICATE,
        actorCertificationId: certification.id,
      });
    }

    for (const medicalCertificate of refreshedProfile.medicalFitnessCertificates) {
      await this.registerExpirySignalsForRecord({
        kind: 'medical',
        profile: refreshedProfile,
        now,
        activeAlertKeys,
        activeTaskKeys,
        title: medicalCertificate.title,
        expiresAt: medicalCertificate.expiresAt,
        status: medicalCertificate.status,
        ownerMessagePrefix: 'Medical fitness certificate',
        ownerTaskType: UserTaskType.RENEW_MEDICAL_FITNESS,
        medicalFitnessCertificateId: medicalCertificate.id,
      });
    }

    for (const contract of refreshedProfile.contracts) {
      impactedUsers.add(contract.project.createdById);

      const ownerTaskKey = `contract-owner:${contract.id}:${contract.project.createdById}`;
      activeTaskKeys.add(ownerTaskKey);
      await this.upsertTask({
        key: ownerTaskKey,
        assignedToUserId: contract.project.createdById,
        projectId: contract.projectId,
        contractId: contract.id,
        profileId: refreshedProfile.id,
        type: UserTaskType.REVIEW_COMPLIANCE,
        title: `Review compliance for ${refreshedProfile.displayName}`,
        description: `Track contract readiness and actor compliance for ${contract.project.name}.`,
        priority: UserTaskPriority.MEDIUM,
        dueDate: contract.startDate ?? this.addDays(now, 5),
      });

      const profileTaskKey = `contract-profile:${contract.id}:${refreshedProfile.userId}`;
      activeTaskKeys.add(profileTaskKey);
      await this.upsertTask({
        key: profileTaskKey,
        assignedToUserId: refreshedProfile.userId,
        projectId: contract.projectId,
        contractId: contract.id,
        profileId: refreshedProfile.id,
        type: UserTaskType.ACCEPT_CONTRACT,
        title: `Prepare contract compliance pack for ${contract.project.name}`,
        description:
          'Keep required insurance, certifications, and medical fitness records valid for the active contract.',
        priority: UserTaskPriority.HIGH,
        dueDate: contract.startDate ?? this.addDays(now, 5),
      });

      const unmet = requirements.filter((item) => !item.satisfied);
      const expiredSignals = [
        ...refreshedProfile.actorDocuments.filter(
          (item) => item.status === ComplianceDocumentStatus.EXPIRED,
        ),
        ...refreshedProfile.actorCertifications.filter(
          (item) => item.status === ComplianceDocumentStatus.EXPIRED,
        ),
        ...refreshedProfile.medicalFitnessCertificates.filter(
          (item) => item.status === ComplianceDocumentStatus.EXPIRED,
        ),
      ];

      if (unmet.length > 0 || expiredSignals.length > 0) {
        const riskKey = `contract-risk:${contract.id}:${refreshedProfile.id}`;
        activeAlertKeys.add(riskKey);
        await this.upsertAlert({
          key: riskKey,
          userId: contract.project.createdById,
          profileId: refreshedProfile.id,
          projectId: contract.projectId,
          contractId: contract.id,
          type: ComplianceAlertType.CONTRACT_ELIGIBILITY_RISK,
          severity:
            expiredSignals.length > 0
              ? ComplianceAlertSeverity.CRITICAL
              : ComplianceAlertSeverity.WARNING,
          message: `${refreshedProfile.displayName} has compliance gaps that may affect project eligibility on ${contract.project.name}.`,
          dueDate: contract.startDate ?? this.addDays(now, 3),
        });
      }
    }

    await this.resolveStaleAlertsAndTasks(
      refreshedProfile.id,
      impactedUsers,
      activeAlertKeys,
      activeTaskKeys,
    );
  }

  private evaluateOnboardingRequirements(profile: any) {
    const definitions = this.getRequirementDefinitions(
      profile.user.role,
      profile.profileType,
    );
    return definitions.map((definition) => {
      if (definition.kind === 'document') {
        const match = profile.actorDocuments.find(
          (item: any) =>
            item.type === definition.documentType && this.isCurrentValid(item),
        );
        const expired = profile.actorDocuments.find(
          (item: any) =>
            item.type === definition.documentType &&
            item.status === ComplianceDocumentStatus.EXPIRED,
        );
        return {
          key: definition.key,
          label: definition.label,
          description: definition.description,
          kind: definition.kind,
          satisfied: Boolean(match),
          status:
            match?.status ??
            expired?.status ??
            ComplianceDocumentStatus.PENDING,
          currentRecordId: match?.id ?? expired?.id ?? null,
        };
      }

      if (definition.kind === 'certification') {
        const match = profile.actorCertifications.find(
          (item: any) =>
            definition.certificationTypes.includes(item.type) &&
            this.isCurrentValid(item),
        );
        const expired = profile.actorCertifications.find(
          (item: any) =>
            definition.certificationTypes.includes(item.type) &&
            item.status === ComplianceDocumentStatus.EXPIRED,
        );
        return {
          key: definition.key,
          label: definition.label,
          description: definition.description,
          kind: definition.kind,
          satisfied: Boolean(match),
          status:
            match?.status ??
            expired?.status ??
            ComplianceDocumentStatus.PENDING,
          currentRecordId: match?.id ?? expired?.id ?? null,
        };
      }

      const match = profile.medicalFitnessCertificates.find(
        (item: any) =>
          (!definition.categories?.length ||
            definition.categories.includes(item.category)) &&
          this.isCurrentValid(item) &&
          item.fitnessDecision !== MedicalFitnessDecision.UNFIT,
      );
      const expired = profile.medicalFitnessCertificates.find(
        (item: any) =>
          (!definition.categories?.length ||
            definition.categories.includes(item.category)) &&
          item.status === ComplianceDocumentStatus.EXPIRED,
      );
      return {
        key: definition.key,
        label: definition.label,
        description: definition.description,
        kind: definition.kind,
        satisfied: Boolean(match),
        status:
          match?.status ?? expired?.status ?? ComplianceDocumentStatus.PENDING,
        currentRecordId: match?.id ?? expired?.id ?? null,
      };
    });
  }

  private getRequirementDefinitions(
    role: string,
    profileType: ProfileType,
  ): RequirementDefinition[] {
    const effectiveType =
      role === 'GENERAL_CONTRACTOR'
        ? ProfileType.GENERAL_CONTRACTOR
        : profileType;

    if (effectiveType === ProfileType.GENERAL_CONTRACTOR) {
      return [
        {
          key: 'company-document',
          label: 'Company registration document',
          description:
            'Upload company registration evidence for the general contractor entity.',
          kind: 'document',
          documentType: ActorDocumentType.COMPANY_DOCUMENT,
        },
        {
          key: 'tax-document',
          label: 'VAT / tax data',
          description:
            'Provide the tax or VAT document required for commercial contracting.',
          kind: 'document',
          documentType: ActorDocumentType.TAX_DOCUMENT,
        },
        {
          key: 'insurance-document',
          label: 'Insurance evidence',
          description:
            'Valid insurance must be on file before contract activation.',
          kind: 'document',
          documentType: ActorDocumentType.INSURANCE_DOCUMENT,
        },
        {
          key: 'project-authority',
          label: 'Project authority document',
          description:
            'Upload the document proving project authority or appointment.',
          kind: 'document',
          documentType: ActorDocumentType.PROJECT_AUTHORITY_DOCUMENT,
        },
      ];
    }

    if (
      effectiveType === ProfileType.CONTRACTOR ||
      effectiveType === ProfileType.SUBCONTRACTOR
    ) {
      return [
        {
          key: 'company-document',
          label: 'Company registration document',
          description:
            'Provide registered company evidence for contractor onboarding.',
          kind: 'document',
          documentType: ActorDocumentType.COMPANY_DOCUMENT,
        },
        {
          key: 'nace-document',
          label: 'NACE activity support',
          description:
            'Upload a document supporting the declared NACE activity.',
          kind: 'document',
          documentType: ActorDocumentType.NACE_ACTIVITY_DOCUMENT,
        },
        {
          key: 'insurance-document',
          label: 'Insurance evidence',
          description:
            'Contractor insurance must remain valid for active work.',
          kind: 'document',
          documentType: ActorDocumentType.INSURANCE_DOCUMENT,
        },
        {
          key: 'trade-certification',
          label: 'Trade certification or permit',
          description:
            'At least one contractor certification, permit, or license is required.',
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
      effectiveType === ProfileType.SUPERVISOR ||
      effectiveType === ProfileType.SPECIALIST ||
      effectiveType === ProfileType.PROFESSIONAL
    ) {
      return [
        {
          key: 'identity-document',
          label: 'Identity document',
          description:
            'Identity evidence is required before individual assignment.',
          kind: 'document',
          documentType: ActorDocumentType.IDENTITY_DOCUMENT,
        },
        {
          key: 'professional-certificate',
          label: 'Certificate or license',
          description:
            'Provide at least one valid professional certificate or license.',
          kind: 'certification',
          certificationTypes: [
            ActorCertificationType.CERTIFICATE,
            ActorCertificationType.LICENSE,
          ],
        },
        {
          key: 'medical-fitness',
          label: 'Medical fitness',
          description:
            'A valid medical fitness certificate is required for assignment eligibility.',
          kind: 'medical',
        },
      ];
    }

    if (effectiveType === ProfileType.CLINIC_DOCTOR) {
      return [
        {
          key: 'authorization-document',
          label: 'Medical authority document',
          description: 'Clinic or doctor authorization must be on file.',
          kind: 'document',
          documentType: ActorDocumentType.AUTHORIZATION_DOCUMENT,
        },
        {
          key: 'medical-license',
          label: 'Medical license',
          description: 'A valid medical license is required.',
          kind: 'certification',
          certificationTypes: [ActorCertificationType.LICENSE],
        },
      ];
    }

    return [
      {
        key: 'authorization-document',
        label: 'Authorization document',
        description:
          'Upload an authorization document for evaluator or trainer access.',
        kind: 'document',
        documentType: ActorDocumentType.AUTHORIZATION_DOCUMENT,
      },
      {
        key: 'training-license',
        label: 'Training record or license',
        description: 'A valid training record or license is required.',
        kind: 'certification',
        certificationTypes: [
          ActorCertificationType.TRAINING_RECORD,
          ActorCertificationType.LICENSE,
        ],
      },
    ];
  }

  private async registerExpirySignalsForRecord(input: {
    kind: 'document' | 'certification' | 'medical';
    profile: any;
    now: Date;
    activeAlertKeys: Set<string>;
    activeTaskKeys: Set<string>;
    title: string;
    expiresAt: Date | null;
    status: ComplianceDocumentStatus;
    ownerMessagePrefix: string;
    ownerTaskType: UserTaskType;
    actorDocumentId?: string;
    actorCertificationId?: string;
    medicalFitnessCertificateId?: string;
  }) {
    if (!input.expiresAt) {
      return;
    }

    const daysUntilExpiry = this.daysBetween(input.now, input.expiresAt);
    const kindMap = {
      document: {
        expiring: ComplianceAlertType.DOCUMENT_EXPIRING,
        expired: ComplianceAlertType.DOCUMENT_EXPIRED,
      },
      certification: {
        expiring: ComplianceAlertType.CERTIFICATION_EXPIRING,
        expired: ComplianceAlertType.CERTIFICATION_EXPIRED,
      },
      medical: {
        expiring: ComplianceAlertType.MEDICAL_EXPIRING,
        expired: ComplianceAlertType.MEDICAL_EXPIRED,
      },
    } as const;

    if (
      input.status === ComplianceDocumentStatus.EXPIRED ||
      daysUntilExpiry < 0
    ) {
      const alertKey = `expired:${input.kind}:${input.profile.id}:${input.title}`;
      input.activeAlertKeys.add(alertKey);
      await this.upsertAlert({
        key: alertKey,
        userId: input.profile.userId,
        profileId: input.profile.id,
        actorDocumentId: input.actorDocumentId,
        actorCertificationId: input.actorCertificationId,
        medicalFitnessCertificateId: input.medicalFitnessCertificateId,
        type: kindMap[input.kind].expired,
        severity: ComplianceAlertSeverity.CRITICAL,
        message: `${input.ownerMessagePrefix} "${input.title}" has expired and may block eligibility.`,
        dueDate: input.expiresAt,
      });

      const taskKey = `expired-task:${input.kind}:${input.profile.id}:${input.title}`;
      input.activeTaskKeys.add(taskKey);
      await this.upsertTask({
        key: taskKey,
        assignedToUserId: input.profile.userId,
        profileId: input.profile.id,
        actorDocumentId: input.actorDocumentId,
        actorCertificationId: input.actorCertificationId,
        medicalFitnessCertificateId: input.medicalFitnessCertificateId,
        type: input.ownerTaskType,
        title: `Renew ${input.title}`,
        description: `${input.ownerMessagePrefix} has expired and needs renewal.`,
        priority: UserTaskPriority.CRITICAL,
        dueDate: input.expiresAt,
      });
      return;
    }

    if (daysUntilExpiry <= 30) {
      const alertKey = `expiring:${input.kind}:${input.profile.id}:${input.title}`;
      input.activeAlertKeys.add(alertKey);
      await this.upsertAlert({
        key: alertKey,
        userId: input.profile.userId,
        profileId: input.profile.id,
        actorDocumentId: input.actorDocumentId,
        actorCertificationId: input.actorCertificationId,
        medicalFitnessCertificateId: input.medicalFitnessCertificateId,
        type: kindMap[input.kind].expiring,
        severity:
          daysUntilExpiry <= 15
            ? ComplianceAlertSeverity.CRITICAL
            : ComplianceAlertSeverity.WARNING,
        message: `${input.ownerMessagePrefix} "${input.title}" expires on ${input.expiresAt.toISOString().slice(0, 10)}.`,
        dueDate: input.expiresAt,
      });

      const taskKey = `expiring-task:${input.kind}:${input.profile.id}:${input.title}`;
      input.activeTaskKeys.add(taskKey);
      await this.upsertTask({
        key: taskKey,
        assignedToUserId: input.profile.userId,
        profileId: input.profile.id,
        actorDocumentId: input.actorDocumentId,
        actorCertificationId: input.actorCertificationId,
        medicalFitnessCertificateId: input.medicalFitnessCertificateId,
        type: input.ownerTaskType,
        title: `Prepare renewal for ${input.title}`,
        description:
          daysUntilExpiry <= 15
            ? `${input.ownerMessagePrefix} expires within 15 days and should be renewed urgently.`
            : `${input.ownerMessagePrefix} expires within 30 days and should be renewed.`,
        priority:
          daysUntilExpiry <= 15
            ? UserTaskPriority.HIGH
            : UserTaskPriority.MEDIUM,
        dueDate: input.expiresAt,
      });
    }
  }

  private async resolveStaleAlertsAndTasks(
    profileId: string,
    impactedUsers: Set<string>,
    activeAlertKeys: Set<string>,
    activeTaskKeys: Set<string>,
  ) {
    const users = Array.from(impactedUsers);
    const existingAlerts = await this.prisma.complianceAlert.findMany({
      where: {
        profileId,
        userId: { in: users },
        status: { not: ComplianceAlertStatus.RESOLVED },
      },
    });
    const existingTasks = await this.prisma.userTask.findMany({
      where: {
        profileId,
        assignedToUserId: { in: users },
        status: { not: UserTaskStatus.COMPLETED },
      },
    });

    for (const alert of existingAlerts) {
      if (!activeAlertKeys.has(alert.key)) {
        await this.prisma.complianceAlert.update({
          where: { id: alert.id },
          data: {
            status: ComplianceAlertStatus.RESOLVED,
            resolvedAt: new Date(),
          },
        });
      }
    }

    for (const task of existingTasks) {
      if (!activeTaskKeys.has(task.key)) {
        await this.prisma.userTask.update({
          where: { id: task.id },
          data: {
            status: UserTaskStatus.COMPLETED,
            completedAt: task.completedAt ?? new Date(),
          },
        });
      }
    }
  }

  private async upsertAlert(input: {
    key: string;
    userId: string;
    profileId?: string;
    projectId?: string;
    contractId?: string;
    actorDocumentId?: string;
    actorCertificationId?: string;
    medicalFitnessCertificateId?: string;
    type: ComplianceAlertType;
    severity: ComplianceAlertSeverity;
    message: string;
    dueDate?: Date | null;
  }) {
    await this.prisma.complianceAlert.upsert({
      where: { key: input.key },
      update: {
        severity: input.severity,
        message: input.message,
        dueDate: input.dueDate ?? null,
        status: ComplianceAlertStatus.PENDING,
        resolvedAt: null,
      },
      create: {
        key: input.key,
        userId: input.userId,
        profileId: input.profileId ?? null,
        projectId: input.projectId ?? null,
        contractId: input.contractId ?? null,
        actorDocumentId: input.actorDocumentId ?? null,
        actorCertificationId: input.actorCertificationId ?? null,
        medicalFitnessCertificateId: input.medicalFitnessCertificateId ?? null,
        type: input.type,
        severity: input.severity,
        message: input.message,
        dueDate: input.dueDate ?? null,
      },
    });
  }

  private async upsertTask(input: {
    key: string;
    assignedToUserId: string;
    projectId?: string;
    contractId?: string;
    profileId?: string;
    actorDocumentId?: string;
    actorCertificationId?: string;
    medicalFitnessCertificateId?: string;
    type: UserTaskType;
    title: string;
    description?: string;
    priority: UserTaskPriority;
    dueDate?: Date | null;
  }) {
    await this.prisma.userTask.upsert({
      where: { key: input.key },
      update: {
        title: input.title,
        description: input.description ?? null,
        priority: input.priority,
        dueDate: input.dueDate ?? null,
        status: UserTaskStatus.OPEN,
        completedAt: null,
      },
      create: {
        key: input.key,
        assignedToUserId: input.assignedToUserId,
        projectId: input.projectId ?? null,
        contractId: input.contractId ?? null,
        profileId: input.profileId ?? null,
        actorDocumentId: input.actorDocumentId ?? null,
        actorCertificationId: input.actorCertificationId ?? null,
        medicalFitnessCertificateId: input.medicalFitnessCertificateId ?? null,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority,
        dueDate: input.dueDate ?? null,
      },
    });
  }

  private taskTypeForRequirement(requirement: any) {
    if (requirement.kind === 'medical') {
      return UserTaskType.RENEW_MEDICAL_FITNESS;
    }

    if (requirement.key.includes('insurance')) {
      return UserTaskType.UPLOAD_INSURANCE;
    }

    if (requirement.kind === 'certification') {
      return UserTaskType.UPLOAD_CERTIFICATE;
    }

    return UserTaskType.COMPLETE_PROFILE;
  }

  private isCurrentValid(item: {
    status: ComplianceDocumentStatus;
    expiresAt?: Date | null;
  }) {
    if (item.status !== ComplianceDocumentStatus.VALID) {
      return false;
    }

    return !item.expiresAt || item.expiresAt >= new Date();
  }

  private daysBetween(left: Date, right: Date) {
    return Math.floor(
      (right.getTime() - left.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  private addDays(base: Date, days: number) {
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next;
  }

  private toActorDocumentResponse(document: any) {
    return {
      id: document.id,
      profileId: document.profileId,
      userId: document.userId,
      profileDocumentId: document.profileDocumentId,
      type: document.type,
      title: document.title,
      issuer: document.issuer,
      issuedAt: document.issuedAt,
      expiresAt: document.expiresAt,
      status: document.status,
      verifiedById: document.verifiedById,
      verifiedAt: document.verifiedAt,
      notes: document.notes,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      profileDocument: document.profileDocument
        ? {
            id: document.profileDocument.id,
            title: document.profileDocument.title,
            fileName: document.profileDocument.fileName,
            mimeType: document.profileDocument.mimeType,
          }
        : null,
    };
  }

  private toActorCertificationResponse(certification: any) {
    return {
      id: certification.id,
      profileId: certification.profileId,
      userId: certification.userId,
      actorDocumentId: certification.actorDocumentId,
      type: certification.type,
      title: certification.title,
      issuer: certification.issuer,
      issuedAt: certification.issuedAt,
      expiresAt: certification.expiresAt,
      status: certification.status,
      escoSkill: certification.escoSkill
        ? {
            id: certification.escoSkill.id,
            code: certification.escoSkill.code,
            title: certification.escoSkill.title,
          }
        : null,
      verifiedById: certification.verifiedById,
      verifiedAt: certification.verifiedAt,
      createdAt: certification.createdAt,
      updatedAt: certification.updatedAt,
      actorDocument: certification.actorDocument
        ? this.toActorDocumentResponse(certification.actorDocument)
        : null,
    };
  }

  private toMedicalFitnessResponse(certificate: any) {
    return {
      id: certificate.id,
      profileId: certificate.profileId,
      userId: certificate.userId,
      actorDocumentId: certificate.actorDocumentId,
      category: certificate.category,
      title: certificate.title,
      issuerName: certificate.issuerName,
      issuedByProfile: certificate.issuedByProfile
        ? {
            id: certificate.issuedByProfile.id,
            displayName: certificate.issuedByProfile.displayName,
            profileType: certificate.issuedByProfile.profileType,
          }
        : null,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      status: certificate.status,
      fitnessDecision: certificate.fitnessDecision,
      jobSpecificClearance: certificate.jobSpecificClearance,
      verifiedById: certificate.verifiedById,
      verifiedAt: certificate.verifiedAt,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
      actorDocument: certificate.actorDocument
        ? this.toActorDocumentResponse(certificate.actorDocument)
        : null,
    };
  }

  private toAlertResponse(alert: any) {
    return {
      id: alert.id,
      key: alert.key,
      userId: alert.userId,
      profileId: alert.profileId,
      projectId: alert.projectId,
      contractId: alert.contractId,
      actorDocumentId: alert.actorDocumentId,
      actorCertificationId: alert.actorCertificationId,
      medicalFitnessCertificateId: alert.medicalFitnessCertificateId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      dueDate: alert.dueDate,
      status: alert.status,
      createdAt: alert.createdAt,
      sentAt: alert.sentAt,
      readAt: alert.readAt,
      resolvedAt: alert.resolvedAt,
    };
  }

  private toTaskResponse(task: any) {
    return {
      id: task.id,
      key: task.key,
      assignedToUserId: task.assignedToUserId,
      projectId: task.projectId,
      contractId: task.contractId,
      profileId: task.profileId,
      actorDocumentId: task.actorDocumentId,
      actorCertificationId: task.actorCertificationId,
      medicalFitnessCertificateId: task.medicalFitnessCertificateId,
      type: task.type,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
      project: task.project
        ? {
            id: task.project.id,
            name: task.project.name,
            slug: task.project.slug,
          }
        : null,
      contract: task.contract
        ? {
            id: task.contract.id,
            title: task.contract.title,
            status: task.contract.status,
          }
        : null,
    };
  }

  private async getCurrentProfileOrThrow(user: AuthenticatedUser) {
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

  private async getManagedProfile(profileId: string, user: AuthenticatedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (user.role !== 'ADMIN' && profile.userId !== user.sub) {
      throw new ForbiddenException('You do not have access to this profile');
    }

    return profile;
  }

  private async assertProfileDocumentOwnership(
    profileDocumentId: string | undefined,
    profileId: string,
  ) {
    if (!profileDocumentId) {
      return;
    }

    const document = await this.prisma.profileDocument.findFirst({
      where: {
        id: profileDocumentId,
        profileId,
      },
    });

    if (!document) {
      throw new BadRequestException(
        'Referenced profile document does not belong to this profile',
      );
    }
  }

  private async assertActorDocumentOwnership(
    actorDocumentId: string | undefined,
    profileId: string,
  ) {
    if (!actorDocumentId) {
      return;
    }

    const document = await this.prisma.actorDocument.findFirst({
      where: {
        id: actorDocumentId,
        profileId,
      },
    });

    if (!document) {
      throw new BadRequestException(
        'Referenced actor document does not belong to this profile',
      );
    }
  }

  private async assertIssuedByProfile(profileId: string | undefined) {
    if (!profileId) {
      return;
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new BadRequestException('Issuing profile not found');
    }
  }

  private toDate(value?: string | null) {
    if (!value) {
      return undefined;
    }

    return new Date(value);
  }

  private readonly actorDocumentInclude = {
    profileDocument: true,
  } as const;

  private readonly actorCertificationInclude = {
    actorDocument: {
      include: this.actorDocumentInclude,
    },
    escoSkill: true,
  } as const;

  private readonly medicalFitnessInclude = {
    actorDocument: {
      include: this.actorDocumentInclude,
    },
    issuedByProfile: true,
  } as const;

  private readonly alertInclude = {} as const;

  private readonly taskInclude = {
    project: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    contract: {
      select: {
        id: true,
        title: true,
        status: true,
      },
    },
  } as const;

  private readonly profileComplianceInclude = {
    user: true,
    actorDocuments: {
      include: this.actorDocumentInclude,
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    actorCertifications: {
      include: this.actorCertificationInclude,
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    medicalFitnessCertificates: {
      include: this.medicalFitnessInclude,
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    contracts: {
      where: {
        status: {
          in: activeContractStatuses,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            createdById: true,
          },
        },
      },
    },
  } as const;
}
