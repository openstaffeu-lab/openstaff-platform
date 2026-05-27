import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationSeverity,
  ProjectContractStatus,
  ProjectWorkerAssignmentStatus,
  UserTaskPriority,
  UserTaskStatus,
  UserTaskType,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ComplianceEligibilityService } from '../compliance/compliance-eligibility.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectWorkerAssignmentDto } from './dto/create-project-worker-assignment.dto';
import { UpdateProjectWorkerAssignmentStatusDto } from './dto/update-project-worker-assignment-status.dto';
import { ProjectAccessPolicy } from './project-access.policy';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

const actorContractStatuses: ProjectContractStatus[] = [
  ProjectContractStatus.DRAFT,
  ProjectContractStatus.SENT,
  ProjectContractStatus.ACCEPTED,
  ProjectContractStatus.ACTIVE,
  ProjectContractStatus.COMPLETED,
];

@Injectable()
export class ProjectWorkerAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly complianceEligibilityService: ComplianceEligibilityService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    projectId: string,
    body: CreateProjectWorkerAssignmentDto,
    user: AuthenticatedUser,
  ) {
    const access = await this.getAssignmentAccess(projectId, user);
    const profileId = access.isOwner
      ? (body.profileId ?? access.currentProfile?.id)
      : access.currentProfile?.id;

    if (!profileId) {
      throw new BadRequestException(
        'A contractor profile is required for worker assignment',
      );
    }

    if (!access.isOwner && body.profileId && body.profileId !== profileId) {
      throw new ForbiddenException(
        'You can only assign workers from your own contractor profile',
      );
    }

    const profile = await this.getProfile(profileId);
    const worker = await this.getWorker(profile.id, body.workerId);
    const jobRequest = body.jobRequestId
      ? await this.getJobRequest(projectId, body.jobRequestId)
      : null;
    const contract =
      body.contractId !== undefined
        ? await this.getContractForProfile(
            projectId,
            profile.id,
            body.contractId,
          )
        : await this.findDefaultContract(projectId, profile.id);

    if (!contract) {
      throw new BadRequestException(
        'Workers can only be assigned from a profile with an active contractual relationship on this project.',
      );
    }

    const existingAssignment =
      await this.prisma.projectWorkerAssignment.findFirst({
        where: {
          projectId,
          profileId: profile.id,
          workerId: worker.id,
          jobRequestId: jobRequest?.id ?? null,
          status: {
            not: ProjectWorkerAssignmentStatus.REMOVED,
          },
        },
      });

    if (existingAssignment) {
      throw new BadRequestException(
        'This worker is already assigned or proposed for that scope',
      );
    }

    const eligibility =
      await this.complianceEligibilityService.evaluateWorkerForProjectByIds(
        projectId,
        profile.id,
        worker.id,
        {
          jobRequestId: jobRequest?.id,
        },
      );

    const isBlocked =
      eligibility.projectEligibility === 'BLOCKED' ||
      eligibility.projectEligibility === 'NOT_ELIGIBLE' ||
      eligibility.jobRequestEligibility === 'BLOCKED' ||
      eligibility.jobRequestEligibility === 'NOT_ELIGIBLE' ||
      eligibility.workerEligibility === 'BLOCKED' ||
      eligibility.workerEligibility === 'NOT_ELIGIBLE';

    const assignment = await this.prisma.projectWorkerAssignment.create({
      data: {
        projectId,
        contractId: contract.id,
        jobRequestId: jobRequest?.id ?? null,
        profileId: profile.id,
        workerId: worker.id,
        status: isBlocked
          ? ProjectWorkerAssignmentStatus.BLOCKED
          : ProjectWorkerAssignmentStatus.PROPOSED,
        assignedById: user.sub,
      },
      include: this.assignmentInclude,
    });

    await this.auditService.log({
      actorUserId: user.sub,
      projectId,
      entityType: 'ProjectWorkerAssignment',
      entityId: assignment.id,
      action: 'CREATE',
      before: null,
      after: this.toAssignmentResponse(assignment, eligibility),
      metadata: {
        jobRequestId: jobRequest?.id ?? null,
        profileId: profile.id,
        workerId: worker.id,
      },
    });

    if (isBlocked) {
      await this.registerBlockedAssignmentSignals(assignment, eligibility);
    }

    return this.toAssignmentResponse(assignment, eligibility);
  }

  async list(projectId: string, user: AuthenticatedUser) {
    const access = await this.getAssignmentAccess(projectId, user);
    const assignments = await this.prisma.projectWorkerAssignment.findMany({
      where: {
        projectId,
        ...(access.isOwner
          ? {}
          : {
              profileId: access.currentProfile?.id,
            }),
      },
      include: this.assignmentInclude,
      orderBy: [{ assignedAt: 'desc' }],
    });

    const responses: any[] = [];
    for (const assignment of assignments) {
      const eligibility =
        await this.complianceEligibilityService.evaluateWorkerForProjectByIds(
          assignment.projectId,
          assignment.profileId,
          assignment.workerId,
          {
            jobRequestId: assignment.jobRequestId ?? undefined,
          },
        );

      const mustBlock =
        assignment.status !== ProjectWorkerAssignmentStatus.REMOVED &&
        (eligibility.projectEligibility === 'BLOCKED' ||
          eligibility.projectEligibility === 'NOT_ELIGIBLE' ||
          eligibility.jobRequestEligibility === 'BLOCKED' ||
          eligibility.jobRequestEligibility === 'NOT_ELIGIBLE' ||
          eligibility.workerEligibility === 'BLOCKED' ||
          eligibility.workerEligibility === 'NOT_ELIGIBLE');

      let effectiveAssignment = assignment;
      if (
        mustBlock &&
        assignment.status !== ProjectWorkerAssignmentStatus.BLOCKED
      ) {
        effectiveAssignment = await this.prisma.projectWorkerAssignment.update({
          where: {
            id: assignment.id,
          },
          data: {
            status: ProjectWorkerAssignmentStatus.BLOCKED,
          },
          include: this.assignmentInclude,
        });

        await this.auditService.log({
          actorUserId: user.sub,
          projectId,
          entityType: 'ProjectWorkerAssignment',
          entityId: assignment.id,
          action: 'AUTO_BLOCK',
          before: {
            status: assignment.status,
          },
          after: {
            status: ProjectWorkerAssignmentStatus.BLOCKED,
          },
          metadata: {
            workerId: assignment.workerId,
            jobRequestId: assignment.jobRequestId,
            reasons: eligibility.blockingReasons,
          },
        });

        await this.registerBlockedAssignmentSignals(
          effectiveAssignment,
          eligibility,
        );
      }

      responses.push(
        this.toAssignmentResponse(effectiveAssignment, eligibility),
      );
    }

    return responses;
  }

  async updateStatus(
    projectId: string,
    assignmentId: string,
    body: UpdateProjectWorkerAssignmentStatusDto,
    user: AuthenticatedUser,
  ) {
    const access = await this.getAssignmentAccess(projectId, user);
    const assignment = await this.prisma.projectWorkerAssignment.findFirst({
      where: {
        id: assignmentId,
        projectId,
      },
      include: this.assignmentInclude,
    });

    if (!assignment) {
      throw new NotFoundException('Worker assignment not found');
    }

    const isProfileOwner =
      access.currentProfile?.id === assignment.profileId &&
      assignment.profile.userId === user.sub;

    if (!access.isOwner && !isProfileOwner) {
      throw new ForbiddenException(
        'You do not have access to update this worker assignment',
      );
    }

    if (body.status === ProjectWorkerAssignmentStatus.APPROVED) {
      if (!access.isOwner) {
        throw new ForbiddenException(
          'Only the project owner can approve worker assignments',
        );
      }

      const eligibility =
        await this.complianceEligibilityService.evaluateWorkerForProjectByIds(
          assignment.projectId,
          assignment.profileId,
          assignment.workerId,
          {
            jobRequestId: assignment.jobRequestId ?? undefined,
          },
        );

      if (
        eligibility.projectEligibility === 'BLOCKED' ||
        eligibility.projectEligibility === 'NOT_ELIGIBLE' ||
        eligibility.jobRequestEligibility === 'BLOCKED' ||
        eligibility.jobRequestEligibility === 'NOT_ELIGIBLE' ||
        eligibility.workerEligibility === 'BLOCKED' ||
        eligibility.workerEligibility === 'NOT_ELIGIBLE'
      ) {
        throw new ForbiddenException(
          `Worker approval is blocked. ${[...eligibility.blockingReasons, ...eligibility.missingItems].join(' | ')}`,
        );
      }

      const updated = await this.prisma.projectWorkerAssignment.update({
        where: { id: assignment.id },
        data: {
          status: ProjectWorkerAssignmentStatus.APPROVED,
          approvedById: user.sub,
          approvedAt: new Date(),
          removedAt: null,
        },
        include: this.assignmentInclude,
      });

      await this.auditService.log({
        actorUserId: user.sub,
        projectId,
        entityType: 'ProjectWorkerAssignment',
        entityId: assignment.id,
        action: 'STATUS_CHANGE',
        before: { status: assignment.status },
        after: { status: updated.status },
      });

      await this.resolveBlockedAssignmentTask(updated);
      return this.toAssignmentResponse(updated, eligibility);
    }

    if (body.status === ProjectWorkerAssignmentStatus.ACTIVE) {
      if (!access.isOwner) {
        throw new ForbiddenException(
          'Only the project owner can activate worker assignments',
        );
      }

      if (assignment.status !== ProjectWorkerAssignmentStatus.APPROVED) {
        throw new BadRequestException(
          'Only approved worker assignments can become active',
        );
      }

      const updated = await this.prisma.projectWorkerAssignment.update({
        where: { id: assignment.id },
        data: {
          status: ProjectWorkerAssignmentStatus.ACTIVE,
        },
        include: this.assignmentInclude,
      });

      await this.auditService.log({
        actorUserId: user.sub,
        projectId,
        entityType: 'ProjectWorkerAssignment',
        entityId: assignment.id,
        action: 'STATUS_CHANGE',
        before: { status: assignment.status },
        after: { status: updated.status },
      });

      await this.resolveBlockedAssignmentTask(updated);
      const eligibility =
        await this.complianceEligibilityService.evaluateWorkerForProjectByIds(
          updated.projectId,
          updated.profileId,
          updated.workerId,
          {
            jobRequestId: updated.jobRequestId ?? undefined,
          },
        );

      return this.toAssignmentResponse(updated, eligibility);
    }

    if (body.status === ProjectWorkerAssignmentStatus.BLOCKED) {
      if (!access.isOwner) {
        throw new ForbiddenException(
          'Only the project owner can block worker assignments',
        );
      }

      const updated = await this.prisma.projectWorkerAssignment.update({
        where: { id: assignment.id },
        data: {
          status: ProjectWorkerAssignmentStatus.BLOCKED,
        },
        include: this.assignmentInclude,
      });

      const eligibility =
        await this.complianceEligibilityService.evaluateWorkerForProjectByIds(
          updated.projectId,
          updated.profileId,
          updated.workerId,
          {
            jobRequestId: updated.jobRequestId ?? undefined,
          },
        );

      await this.registerBlockedAssignmentSignals(updated, eligibility);
      await this.auditService.log({
        actorUserId: user.sub,
        projectId,
        entityType: 'ProjectWorkerAssignment',
        entityId: assignment.id,
        action: 'STATUS_CHANGE',
        before: { status: assignment.status },
        after: { status: updated.status },
      });

      return this.toAssignmentResponse(updated, eligibility);
    }

    if (body.status === ProjectWorkerAssignmentStatus.REMOVED) {
      const updated = await this.prisma.projectWorkerAssignment.update({
        where: { id: assignment.id },
        data: {
          status: ProjectWorkerAssignmentStatus.REMOVED,
          removedAt: new Date(),
        },
        include: this.assignmentInclude,
      });

      await this.auditService.log({
        actorUserId: user.sub,
        projectId,
        entityType: 'ProjectWorkerAssignment',
        entityId: assignment.id,
        action: 'STATUS_CHANGE',
        before: { status: assignment.status },
        after: { status: updated.status },
      });

      await this.resolveBlockedAssignmentTask(updated);
      const eligibility =
        await this.complianceEligibilityService.evaluateWorkerForProjectByIds(
          updated.projectId,
          updated.profileId,
          updated.workerId,
          {
            jobRequestId: updated.jobRequestId ?? undefined,
          },
        );

      return this.toAssignmentResponse(updated, eligibility);
    }

    if (body.status === ProjectWorkerAssignmentStatus.PROPOSED) {
      if (!access.isOwner && !isProfileOwner) {
        throw new ForbiddenException(
          'You cannot re-propose this worker assignment',
        );
      }

      const eligibility =
        await this.complianceEligibilityService.evaluateWorkerForProjectByIds(
          assignment.projectId,
          assignment.profileId,
          assignment.workerId,
          {
            jobRequestId: assignment.jobRequestId ?? undefined,
          },
        );

      const updated = await this.prisma.projectWorkerAssignment.update({
        where: { id: assignment.id },
        data: {
          status:
            eligibility.projectEligibility === 'BLOCKED' ||
            eligibility.projectEligibility === 'NOT_ELIGIBLE' ||
            eligibility.jobRequestEligibility === 'BLOCKED' ||
            eligibility.jobRequestEligibility === 'NOT_ELIGIBLE' ||
            eligibility.workerEligibility === 'BLOCKED' ||
            eligibility.workerEligibility === 'NOT_ELIGIBLE'
              ? ProjectWorkerAssignmentStatus.BLOCKED
              : ProjectWorkerAssignmentStatus.PROPOSED,
          approvedById: null,
          approvedAt: null,
          removedAt: null,
        },
        include: this.assignmentInclude,
      });

      if (updated.status === ProjectWorkerAssignmentStatus.BLOCKED) {
        await this.registerBlockedAssignmentSignals(updated, eligibility);
      }

      await this.auditService.log({
        actorUserId: user.sub,
        projectId,
        entityType: 'ProjectWorkerAssignment',
        entityId: assignment.id,
        action: 'STATUS_CHANGE',
        before: { status: assignment.status },
        after: { status: updated.status },
      });

      if (updated.status !== ProjectWorkerAssignmentStatus.BLOCKED) {
        await this.resolveBlockedAssignmentTask(updated);
      }
      return this.toAssignmentResponse(updated, eligibility);
    }

    throw new BadRequestException('Unsupported assignment status transition');
  }

  private async registerBlockedAssignmentSignals(
    assignment: any,
    eligibility: any,
  ) {
    const workerName =
      `${assignment.worker.firstName} ${assignment.worker.lastName}`.trim();
    const reasons = [
      ...eligibility.blockingReasons,
      ...eligibility.missingItems,
    ]
      .filter(Boolean)
      .slice(0, 5)
      .join(' | ');

    await this.prisma.userTask.upsert({
      where: {
        key: `worker-assignment:${assignment.projectId}:${assignment.workerId}:${assignment.jobRequestId ?? 'all'}`,
      },
      update: {
        status: UserTaskStatus.OPEN,
        priority: UserTaskPriority.CRITICAL,
        title: `Resolve worker eligibility for ${workerName}`,
        description:
          reasons ||
          'Worker assignment is blocked by missing compliance evidence.',
        projectId: assignment.projectId,
        contractId: assignment.contractId,
        profileId: assignment.profileId,
        completedAt: null,
      },
      create: {
        key: `worker-assignment:${assignment.projectId}:${assignment.workerId}:${assignment.jobRequestId ?? 'all'}`,
        assignedToUserId: assignment.profile.userId,
        projectId: assignment.projectId,
        contractId: assignment.contractId,
        profileId: assignment.profileId,
        type: UserTaskType.REVIEW_COMPLIANCE,
        title: `Resolve worker eligibility for ${workerName}`,
        description:
          reasons ||
          'Worker assignment is blocked by missing compliance evidence.',
        status: UserTaskStatus.OPEN,
        priority: UserTaskPriority.CRITICAL,
      },
    });

    await this.notificationService.createInAppNotification({
      key: `worker-assignment-blocked:${assignment.id}:${assignment.approvedAt?.toISOString() ?? assignment.removedAt?.toISOString() ?? assignment.assignedAt.toISOString()}`,
      userId: assignment.project.createdById,
      profileId: null,
      type: 'WORKER_ASSIGNMENT_BLOCKED',
      severity: NotificationSeverity.WARNING,
      title: 'Worker assignment blocked',
      message: `${workerName} cannot be approved for ${assignment.jobRequest?.title ?? 'this project'} until compliance issues are resolved.`,
      relatedEntityType: 'ProjectWorkerAssignment',
      relatedEntityId: assignment.id,
      scheduledFor: new Date(),
    });
  }

  private async resolveBlockedAssignmentTask(assignment: any) {
    const key = `worker-assignment:${assignment.projectId}:${assignment.workerId}:${assignment.jobRequestId ?? 'all'}`;
    const task = await this.prisma.userTask.findUnique({
      where: {
        key,
      },
    });

    if (task && task.status !== UserTaskStatus.COMPLETED) {
      await this.prisma.userTask.update({
        where: {
          id: task.id,
        },
        data: {
          status: UserTaskStatus.COMPLETED,
          completedAt: task.completedAt ?? new Date(),
        },
      });
    }
  }

  private async getAssignmentAccess(
    projectId: string,
    user: AuthenticatedUser,
  ) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (this.accessPolicy.isAdmin(user) || project.createdById === user.sub) {
      return {
        project,
        isOwner: true,
        currentProfile: null as any,
      };
    }

    const currentProfile = await this.prisma.profile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!currentProfile) {
      throw new ForbiddenException(
        'You do not have access to this project worker workspace',
      );
    }

    const linkedContract = await this.prisma.projectContract.findFirst({
      where: {
        projectId,
        profileId: currentProfile.id,
        status: {
          in: actorContractStatuses,
        },
      },
    });

    if (!linkedContract) {
      throw new ForbiddenException(
        'You do not have access to this project worker workspace',
      );
    }

    return {
      project,
      isOwner: false,
      currentProfile,
    };
  }

  private async getProfile(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        id: profileId,
      },
      select: {
        id: true,
        userId: true,
        profileType: true,
        displayName: true,
        companyName: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  private async getWorker(profileId: string, workerId: string) {
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

  private async getJobRequest(projectId: string, jobRequestId: string) {
    const jobRequest = await this.prisma.projectJobRequest.findFirst({
      where: {
        id: jobRequestId,
        projectId,
      },
    });

    if (!jobRequest) {
      throw new NotFoundException('Project job request not found');
    }

    return jobRequest;
  }

  private async getContractForProfile(
    projectId: string,
    profileId: string,
    contractId: string,
  ) {
    const contract = await this.prisma.projectContract.findFirst({
      where: {
        id: contractId,
        projectId,
        profileId,
      },
    });

    if (!contract) {
      throw new NotFoundException(
        'Project contract not found for that profile',
      );
    }

    return contract;
  }

  private async findDefaultContract(projectId: string, profileId: string) {
    return this.prisma.projectContract.findFirst({
      where: {
        projectId,
        profileId,
        status: {
          in: actorContractStatuses,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private toAssignmentResponse(assignment: any, eligibility: any) {
    return {
      id: assignment.id,
      projectId: assignment.projectId,
      contractId: assignment.contractId,
      jobRequestId: assignment.jobRequestId,
      profileId: assignment.profileId,
      workerId: assignment.workerId,
      status: assignment.status,
      assignedById: assignment.assignedById,
      approvedById: assignment.approvedById,
      assignedAt: assignment.assignedAt,
      approvedAt: assignment.approvedAt,
      removedAt: assignment.removedAt,
      project: assignment.project
        ? {
            id: assignment.project.id,
            name: assignment.project.name,
            slug: assignment.project.slug,
            createdById: assignment.project.createdById,
          }
        : null,
      contract: assignment.contract
        ? {
            id: assignment.contract.id,
            title: assignment.contract.title,
            status: assignment.contract.status,
          }
        : null,
      jobRequest: assignment.jobRequest
        ? {
            id: assignment.jobRequest.id,
            title: assignment.jobRequest.title,
            status: assignment.jobRequest.status,
            requiresCertification: assignment.jobRequest.requiresCertification,
          }
        : null,
      profile: assignment.profile
        ? {
            id: assignment.profile.id,
            userId: assignment.profile.userId,
            profileType: assignment.profile.profileType,
            displayName: assignment.profile.displayName,
            companyName: assignment.profile.companyName,
            summary: assignment.profile.summary,
            availabilityStatus: assignment.profile.availabilityStatus,
          }
        : null,
      worker: assignment.worker
        ? {
            id: assignment.worker.id,
            profileId: assignment.worker.profileId,
            firstName: assignment.worker.firstName,
            lastName: assignment.worker.lastName,
            fullName:
              `${assignment.worker.firstName} ${assignment.worker.lastName}`.trim(),
            email: assignment.worker.email,
            phone: assignment.worker.phone,
            roleTitle: assignment.worker.roleTitle,
            employmentType: assignment.worker.employmentType,
            status: assignment.worker.status,
            documents: assignment.worker.documents.map((document: any) => ({
              id: document.id,
              type: document.type,
              title: document.title,
              status: document.status,
              expiresAt: document.expiresAt,
              medicalCategory: document.medicalCategory,
            })),
            skills: assignment.worker.skills.map((skill: any) => ({
              id: skill.id,
              title: skill.title,
              level: skill.level,
              escoSkill: skill.escoSkill
                ? {
                    id: skill.escoSkill.id,
                    code: skill.escoSkill.code,
                    title: skill.escoSkill.title,
                  }
                : null,
            })),
          }
        : null,
      assignedBy: assignment.assignedBy
        ? {
            id: assignment.assignedBy.id,
            email: assignment.assignedBy.email,
            role: assignment.assignedBy.role,
          }
        : null,
      approvedBy: assignment.approvedBy
        ? {
            id: assignment.approvedBy.id,
            email: assignment.approvedBy.email,
            role: assignment.approvedBy.role,
          }
        : null,
      eligibility,
      canApprove:
        eligibility.projectEligibility !== 'BLOCKED' &&
        eligibility.projectEligibility !== 'NOT_ELIGIBLE' &&
        eligibility.jobRequestEligibility !== 'BLOCKED' &&
        eligibility.jobRequestEligibility !== 'NOT_ELIGIBLE' &&
        eligibility.workerEligibility !== 'BLOCKED' &&
        eligibility.workerEligibility !== 'NOT_ELIGIBLE',
    };
  }

  private readonly assignmentInclude = {
    project: {
      select: {
        id: true,
        name: true,
        slug: true,
        createdById: true,
      },
    },
    contract: {
      select: {
        id: true,
        title: true,
        status: true,
      },
    },
    jobRequest: {
      select: {
        id: true,
        title: true,
        status: true,
        requiresCertification: true,
      },
    },
    profile: {
      select: {
        id: true,
        userId: true,
        profileType: true,
        displayName: true,
        companyName: true,
        summary: true,
        availabilityStatus: true,
      },
    },
    worker: {
      include: {
        documents: true,
        skills: {
          include: {
            escoSkill: true,
          },
        },
      },
    },
    assignedBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
    approvedBy: {
      select: {
        id: true,
        email: true,
        role: true,
      },
    },
  } as const;
}
